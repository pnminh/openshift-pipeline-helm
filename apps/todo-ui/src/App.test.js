import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import App from './App';
import axios from 'axios';

jest.mock('axios');
describe('App component', () => {
  const todos = [
    { id: 1, title: 'Test Todo 1', completed: false },
    { id: 2, title: 'Test Todo 2', completed: true },
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: todos });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  it('fetches and displays todos on initial render', async () => {
    render(<App />)
    expect(axios.get).toHaveBeenCalledWith('api/todos');
    await waitFor(() => expect(screen.getByText('Test Todo 1')).toBeInTheDocument());
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
  });
  it('adds a new todo', async () => {
    render(<App />); 
    const newTodo = { id: 3, title: 'New Todo', completed: false };
    axios.post.mockResolvedValue({ data: newTodo });
    fireEvent.click(screen.getByText('New Task'));
    const input = screen.getByPlaceholderText('Task Title');
    fireEvent.change(input, { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByText('Create Task'));
    await waitFor(() => expect(screen.getByText('New Todo')).toBeInTheDocument());
  });
  it('toggles todo completion', async () => {
    render(<App />);
    
    const updatedTodo = { ...todos[0], completed: !todos[0].completed };
    axios.put.mockResolvedValue({ data: updatedTodo });

    await waitFor(() => expect(screen.getByText('Test Todo 1')).toBeInTheDocument());
    
    fireEvent.click(screen.getByTestId(`complete-todo-${todos[0].id}`));
    
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith(`api/todos/${todos[0].id}`, expect.anything()));
    await waitFor(() => expect(screen.getByTestId(`complete-todo-${todos[0].id}`)).toBeChecked());
  });
  it('deletes a todo', async () => {
    render(<App />);
    
    axios.delete.mockResolvedValue({});
    
    await waitFor(() => expect(screen.getByText('Test Todo 1')).toBeInTheDocument());
    
    fireEvent.click(screen.getByTestId(`delete-todo-${todos[0].id}`));
    
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith(`api/todos/1`));
    await waitFor(() => expect(screen.queryByText('Test Todo 1')).not.toBeInTheDocument());
  });
});
