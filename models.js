<<<<<<< HEAD
// models.js
=======
>>>>>>> d06e9d4 (Bugs fixes)
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

<<<<<<< HEAD
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
=======
export const TaskStructure = {
  title: '',
  description: '',
  startDate: null, 
  deadline: null, 
  status: TaskStatus.OPEN,
  employerId: '',
  employeeId: null,
  createdAt: null, 
>>>>>>> d06e9d4 (Bugs fixes)
  images: [],
  history: [],
  employerPhone: ''
};