'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Circle, Trash2, LogOut } from "lucide-react";

const API_BASE_URL = process.env.API_BASE_URL;

interface Task {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthForm {
  email: string;
  password: string;
  name: string;
}

interface NewTask {
  title: string;
  description: string;
}

export default function TaskManager() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({ title: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const [authForm, setAuthForm] = useState<AuthForm>({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchTasks(token);
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      localStorage.setItem('token', data.token);
      setUser(data.user);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      });

      if (!response.ok) throw new Error('Failed to create task');

      const data: Task = await response.json();
      setTasks([data, ...tasks]);
      setNewTask({ title: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) return;

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...task, completed: !task.completed })
      });

      if (!response.ok) throw new Error('Failed to update task');

      const updatedTask: Task = await response.json();
      setTasks(tasks.map(t => t._id === taskId ? updatedTask : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTasks([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? 'Login' : 'Register'}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
              </Button>
            </form>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Task Manager</CardTitle>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Task title"
                className="w-full p-2 border rounded-md"
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Task description"
                className="w-full p-2 border rounded-md"
                rows={3}
              />
              <Button type="submit" className="w-full">
                Add Task
              </Button>
            </form>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`p-4 rounded-lg border transition-all ${
                    task.completed ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        task.completed ? 'text-gray-500 line-through' : ''
                      }`}>
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => toggleComplete(task._id)}
                        className="text-gray-500 hover:text-green-600 transition-colors"
                      >
                        {task.completed ? 
                          <CheckCircle2 className="h-5 w-5" /> :
                          <Circle className="h-5 w-5" />
                        }
                      </button>
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}