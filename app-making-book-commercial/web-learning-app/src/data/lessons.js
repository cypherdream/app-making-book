// Each lesson lives in its own JSON file under ./lessons/ — editing a
// lesson means editing one small JSON file, not scrolling a huge JSX
// file to find the right array entry.
import architecture from './lessons/architecture.json';
import mvvmHilt from './lessons/mvvm-hilt.json';
import room from './lessons/room.json';
import retrofit from './lessons/retrofit.json';
import server from './lessons/server.json';
import prisma from './lessons/prisma.json';
import auth from './lessons/auth.json';
import socket from './lessons/socket.json';

export const LESSONS = [architecture, mvvmHilt, room, retrofit, server, prisma, auth, socket];

export const ACHIEVEMENTS = [
  { id: 'first', label: 'First Lesson', test: (done) => Object.keys(done).length >= 1 },
  { id: 'five', label: '5 Lessons', test: (done) => Object.keys(done).length >= 5 },
  { id: 'android', label: 'Android Track Complete', test: (done) => LESSONS.filter((l) => l.track === 'android').every((l) => done[l.id]) },
  { id: 'backend', label: 'Backend Track Complete', test: (done) => LESSONS.filter((l) => l.track === 'backend').every((l) => done[l.id]) },
  { id: 'all', label: 'Full Repo Mastered', test: (done) => LESSONS.every((l) => done[l.id]) },
];
