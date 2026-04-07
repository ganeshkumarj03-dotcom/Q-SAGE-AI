export type UserRole = 'admin' | 'faculty' | 'student' | null;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  is_coordinator?: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'Short' | 'Long';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  module: number;
  answer?: string;
  marks: number;
}

export interface Syllabus {
  courseName: string;
  courseCode: string;
  semester: string;
  modules: {
    id: number;
    title: string;
    topics: string[];
  }[];
}

export interface QuestionPaper {
  id: string;
  course: string;
  examType: string;
  date: string;
  sections: {
    title: string;
    questions: Question[];
  }[];
}
