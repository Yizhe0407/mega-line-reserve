import liff from "@line/liff";
import { useStepStore } from "@/store/step-store";
import { useMemo } from "react";
import type { Service } from "@/types";

type LiffMessage = Parameters<typeof liff.sendMessages>[0][number];

export function useLiffMessage() {
    const step1Data = useStepStore((state) => state.step1Data);
    const step2Data = useStepStore((state) => state.step2Data);
    const step3Data = useStepStore((state) => state.step3Data);
    const services = useStepStore((state) => state.services) as Service[];

    // 處理服務項目顯示
    const getServiceList = useMemo(() => {
        if (services.length === 0) return "";
        const otherService = services.find((s) => s.name === '其他');
        const list = (step2Data.selectServe || []).map((id) => {
            if (id === otherService?.id && step2Data.otherService) {
                return `其他(${step2Data.otherService})`;
            }
            const service = services.find((s) => s.id === id);
            return service ? service.name : "";
        });
        return list.join('、');
    }, [services, step2Data.selectServe, step2Data.otherService]);

    const sendLineMessage = async () => {
        try {
            const flexMessage: LiffMessage = {
                type: "flex",
                altText: "預約成功通知",
                contents: {
                    type: "bubble",
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "預約資訊",
                                weight: "bold",
                                size: "xxl",
                                margin: "md"
                            },
                            {
                                type: "separator",
                                margin: "xxl"
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                margin: "xxl",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "日期 Date",
                                                size: "md",
                                                color: "#555555",
                                                flex: 0
                                            },
                                            {
                                                type: "text",
                                                text: step3Data.date,
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "時間 Time",
                                                size: "md",
                                                color: "#555555",
                                                flex: 0
                                            },
                                            {
                                                type: "text",
                                                text: step3Data.time,
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "separator",
                                        margin: "xxl"
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "xxl",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "姓名 Name",
                                                size: "md",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: step1Data.name ?? "",
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "車牌號碼 License",
                                                size: "md",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: step1Data.license ?? "",
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "服務項目 Services",
                                                size: "md",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: getServiceList,
                                                size: "md",
                                                color: "#111111",
                                                align: "end",
                                                wrap: true
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: "separator",
                                margin: "xxl"
                            },
                            {
                                type: "box",
                                layout: "horizontal",
                                margin: "md",
                                contents: [
                                    {
                                        type: "text",
                                        text: "到府牽車 Pickup Service",
                                        size: "sm",
                                        color: "#aaaaaa",
                                        flex: 0
                                    },
                                    {
                                        type: "text",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        align: "end",
                                        text: step2Data.extra ? "是" : "否"
                                    }
                                ]
                            }
                        ]
                    },
                    styles: {
                        footer: {
                            separator: true
                        }
                    }
                }
            };

            await liff.sendMessages([flexMessage]);
            return true;
        } catch (error) {
            console.error('LINE 訊息發送失敗:', error);
            return false;
        }
    };

    const sendUpdateLineMessage = async (data: { 
        date: string; 
        time: string; 
        license: string; 
        serviceNames: string[];
        isPickup: boolean;
    }) => {
        try {
            const flexMessage: LiffMessage = {
                type: "flex",
                altText: "預約更新通知",
                contents: {
                    type: "bubble",
                    body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "更新預約",
                                weight: "bold",
                                size: "xxl",
                                margin: "md",
                                color: "#00B900" 
                            },
                            {
                                type: "text",
                                text: "您的預約已成功更新",
                                size: "xs",
                                color: "#aaaaaa",
                                margin: "sm"
                            },
                            {
                                type: "separator",
                                margin: "xxl"
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                margin: "xxl",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "日期 Date",
                                                size: "md",
                                                color: "#555555",
                                                flex: 0
                                            },
                                            {
                                                type: "text",
                                                text: data.date,
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "時間 Time",
                                                size: "md",
                                                color: "#555555",
                                                flex: 0
                                            },
                                            {
                                                type: "text",
                                                text: data.time,
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "separator",
                                        margin: "xxl"
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "xxl",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "車牌號碼 License",
                                                size: "md",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: data.license,
                                                size: "md",
                                                color: "#111111",
                                                align: "end"
                                            }
                                        ]
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "服務項目 Services",
                                                size: "md",
                                                color: "#555555"
                                            },
                                            {
                                                type: "text",
                                                text: data.serviceNames.join('、'),
                                                size: "md",
                                                color: "#111111",
                                                align: "end",
                                                wrap: true
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: "separator",
                                margin: "xxl"
                            },
                            {
                                type: "box",
                                layout: "horizontal",
                                margin: "md",
                                contents: [
                                    {
                                        type: "text",
                                        text: "到府牽車 Pickup Service",
                                        size: "sm",
                                        color: "#aaaaaa",
                                        flex: 0
                                    },
                                    {
                                        type: "text",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        align: "end",
                                        text: data.isPickup ? "是" : "否"
                                    }
                                ]
                            }
                        ]
                    }
                }
            };

            await liff.sendMessages([flexMessage]);
            return true;
        } catch (error) {
            console.error('LINE 訊息發送失敗:', error);
            return false;
        }
    };

    return { sendLineMessage, sendUpdateLineMessage };
}
