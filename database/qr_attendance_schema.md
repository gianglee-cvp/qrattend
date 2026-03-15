# MongoDB Schema

## Student
- studentId: String
- name: String
- class: String

## Attendance
- studentId: String
- sessionId: String
- timestamp: Date

## Session (optional)
- sessionId: String
- subject: String
- date: Date

> Các schema này dùng cho backend Node.js với Mongoose.