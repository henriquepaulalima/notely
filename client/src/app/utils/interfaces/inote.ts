export interface INote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
