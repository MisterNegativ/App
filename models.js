// models.js
export const TaskStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed'
};

export const TaskAction = {
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned'
};

// Пример структуры для документа задачи
export const TaskStructure = {
  title: '',
  description: '',
  startDate: null, // будет Firestore Timestamp
  deadline: null, // будет Firestore Timestamp
  status: TaskStatus.OPEN,
  employerId: '',
  employeeId: null,
  createdAt: null, // будет Firestore Timestamp
  images: [],
  history: [],
  employerPhone: ''
};