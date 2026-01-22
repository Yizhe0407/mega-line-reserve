export interface Step1Data {
  pictureUrl?: string;
  name?: string;
  phone?: string;
  license?: string;
}

export interface Step2Data {
  selectServe: number[];
  otherService: string;
  extra: boolean;
  isOtherServiceSelected: boolean;
}

export interface Step3Data {
  date: string;
  time: string;
  timeSlotId: number | null;
}
