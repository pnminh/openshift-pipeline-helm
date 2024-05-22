import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import App from './App';

describe('App component', () => {
	beforeEach(() => {
		localStorage.clear();
	});

  it('renders without crashing', () => {
    render(<App />);
  });

  it('adds a new task when "New Task" button is clicked', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);
    createNewItem(getByText, getByPlaceholderText);
    await waitFor(() => {
      expect(getByText('Test Task')).toBeInTheDocument();
      expect(getByText('Test Summary')).toBeInTheDocument();
    });
  });

  it('deletes a task when delete icon is clicked', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<App />);

    createNewItem(getByText, getByPlaceholderText);

    const deleteIcon = getByTestId('delete-task-0');
    fireEvent.click(deleteIcon);

    await waitFor(() => {
      expect(getByText('You have no tasks')).toBeInTheDocument();
    });
  });
});

const createNewItem = (getByText, getByPlaceholderText) => {
	const newTaskButton = getByText('New Task');
	fireEvent.click(newTaskButton);

	const taskTitleInput = getByPlaceholderText('Task Title');
	const taskSummaryInput = getByPlaceholderText('Task Summary');

	fireEvent.change(taskTitleInput, { target: { value: 'Test Task' } });
	fireEvent.change(taskSummaryInput, { target: { value: 'Test Summary' } });

	const createTaskButton = getByText('Create Task');
	fireEvent.click(createTaskButton);
}
