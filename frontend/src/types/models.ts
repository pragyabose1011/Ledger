export interface Meeting {
  id: string;
  title: string;
  platform: string;
  created_at: string;
}

export interface Decision {
  id: string;
  summary: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  description: string;
  status: string;
  owner?: string;
  created_at: string;
}

export interface MeetingDetail extends Meeting {
  decisions: Decision[];
  action_items: ActionItem[];
}
