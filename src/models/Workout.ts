export interface Creator {
  id: string;
  name: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  likes?: number;
  creator?: Creator;
  type?: string;
  muscleGroup?: string[];
  equipment?: string[];
  isShared?: boolean;
} 