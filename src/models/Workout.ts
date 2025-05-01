export interface Creator {
  id: string;
  name: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  type: string;
  muscleGroup: string[];
  equipment: string[];
  thumbnailUrl: string;
  likes: number;
  isShared: boolean;
  createdAt: string;
  createdBy?: string;
} 