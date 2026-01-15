export interface CrmContact {
  id: string;
  name: string | null;
  phoneNumber: string;
}

export interface CrmStage {
  id: string;
  name: string;
  color: string;
  isFinal: boolean;
  isWon: boolean;
  orderIndex: number;
  _count: {
    deals: number;
  };
}

export interface CrmDeal {
  id: string;
  title: string;
  value: number | null;
  probability: number;
  company: string | null;
  nextActionAt: string | null;
  stageId: string;
  contact: CrmContact | null;
  stage: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    activities: number;
    tasks: number;
  };
}

export interface CrmActivity {
  id: string;
  activityType: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string | null; email: string };
}

export interface CrmTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  priority: string;
}
