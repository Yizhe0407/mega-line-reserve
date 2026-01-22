"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { ensureLiffInit } from "@/lib/liff";
import { auth, timeSlot as timeSlotApi } from "@/lib/api";
import type { TimeSlot } from "@/types/timeSlot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

export default function TimeSlotAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formDayOfWeek, setFormDayOfWeek] = useState<string>("");
  const [formTime, setFormTime] = useState("");
  const [formCapacity, setFormCapacity] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDayOfWeek, setEditDayOfWeek] = useState<number>(0);
  const [editTime, setEditTime] = useState("");
  const [editCapacity, setEditCapacity] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);

  // 按星期分組時段
  const groupedSlots = useMemo(() => {
    const groups: Record<number, TimeSlot[]> = {};
    timeSlots.forEach((slot) => {
      if (!groups[slot.dayOfWeek]) {
        groups[slot.dayOfWeek] = [];
      }
      groups[slot.dayOfWeek].push(slot);
    });
    // 每組內按時間排序
    Object.keys(groups).forEach((day) => {
      groups[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return groups;
  }, [timeSlots]);

  const loadTimeSlots = async (token: string) => {
    const data = await timeSlotApi.getAllTimeSlots(token);
    setTimeSlots(data);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await ensureLiffInit({ withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          setError("無法取得 ID token");
          return;
        }

        const me = await auth.getMe(idToken);
        if (me.user.role !== "ADMIN") {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
        await loadTimeSlots(idToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleCreate = async () => {
    if (!formDayOfWeek || !formTime) {
      setError("請選擇星期和時間");
      return;
    }
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.createTimeSlot(
        {
          dayOfWeek: Number(formDayOfWeek),
          startTime: formTime,
          capacity: formCapacity,
          isActive: formIsActive,
        },
        idToken
      );
      setFormDayOfWeek("");
      setFormTime("");
      setFormCapacity(1);
      setFormIsActive(true);
      await loadTimeSlots(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    }
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingId(slot.id);
    setEditDayOfWeek(slot.dayOfWeek);
    setEditTime(slot.startTime);
    setEditCapacity(slot.capacity);
    setEditIsActive(slot.isActive);
  };

  const handleUpdate = async () => {
    if (!editingId || !editTime) {
      setError("請填寫完整資訊");
      return;
    }
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.updateTimeSlot(
        editingId,
        {
          dayOfWeek: editDayOfWeek,
          startTime: editTime,
          capacity: editCapacity,
          isActive: editIsActive,
        },
        idToken
      );
      setEditingId(null);
      await loadTimeSlots(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此時段嗎？")) return;
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.deleteTimeSlot(id, idToken);
      await loadTimeSlots(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>時段管理</CardTitle>
          </CardHeader>
          <CardContent>載入中...</CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>時段管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>權限不足</AlertTitle>
              <AlertDescription>此頁面僅提供管理員使用。</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")}>回首頁</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>新增時段</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert>
                <AlertTitle>錯誤</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">星期</label>
                <Select value={formDayOfWeek} onValueChange={setFormDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇星期" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day, index) => (
                      <SelectItem key={index} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">時間</label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">容量</label>
                <Input
                  type="number"
                  min={1}
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">啟用</label>
                <div className="flex items-center gap-2 h-10">
                  <Checkbox
                    checked={formIsActive}
                    onCheckedChange={(checked) => setFormIsActive(checked === true)}
                  />
                  <span className="text-sm">可預約</span>
                </div>
              </div>
            </div>
            <Button onClick={handleCreate}>新增</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>時段列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(groupedSlots).length === 0 ? (
              <div className="text-sm text-muted-foreground">尚無時段</div>
            ) : (
              <div className="space-y-6">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                  const slots = groupedSlots[dayIndex];
                  if (!slots || slots.length === 0) return null;
                  
                  return (
                    <div key={dayIndex} className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        {WEEKDAYS[dayIndex]}
                      </h3>
                      <div className="space-y-2">
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="border rounded-lg p-3 flex items-center justify-between"
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {slot.startTime}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                容量：{slot.capacity} ｜ 狀態：{slot.isActive ? "啟用" : "停用"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(slot)}>
                                編輯
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(slot.id)}>
                                刪除
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {editingId && (
          <Card>
            <CardHeader>
              <CardTitle>編輯時段</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">星期</label>
                  <Select value={String(editDayOfWeek)} onValueChange={(v: string) => setEditDayOfWeek(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">時間</label>
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">容量</label>
                  <Input
                    type="number"
                    min={1}
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">啟用</label>
                  <div className="flex items-center gap-2 h-10">
                    <Checkbox
                      checked={editIsActive}
                      onCheckedChange={(checked) => setEditIsActive(checked === true)}
                    />
                    <span className="text-sm">可預約</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdate}>儲存</Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
