import {
	Button,
	Container,
	Text,
	Title,
	Modal,
	TextInput,
	Group,
	Card,
	ActionIcon,
	Tooltip,
	Switch
} from '@mantine/core';
import { useState, useRef, useEffect } from 'react';
import { MoonStars, Sun, Trash } from 'tabler-icons-react';

import {
	MantineProvider,
	ColorSchemeProvider,
} from '@mantine/core';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import axios from 'axios';

const API_URL = 'api/todos'
export default function App() {
	const [todos, setTodos] = useState([]);
	const [opened, setOpened] = useState(false);

	const [colorScheme, setColorScheme] = useLocalStorage({
		key: 'mantine-color-scheme',
		defaultValue: 'light',
		getInitialValueInEffect: true,
	});

	useEffect(() => {
		fetchTodos();
	}, []);
	const fetchTodos = async () => {
		const response = await axios.get(API_URL);
		setTodos(response.data);
	};
	const toggleColorScheme = value =>
		setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
	useHotkeys([['mod+J', () => toggleColorScheme()]]);

	const addTodo = async () => {
		const response = await axios.post(API_URL, { title: todoTitle.current.value, completed: false });
		setTodos([...todos, response.data]);
	};

	const toggleComplete = async (todo) => {
		const response = await axios.put(`${API_URL}/${todo.id}`, { title: todo.title, completed: !todo.completed });
		setTodos(todos.map(_todo => (_todo.id === todo.id ? response.data : _todo)));
	};

	const deleteTodo = async id => {
		await axios.delete(`${API_URL}/${id}`);
		setTodos(todos.filter(todo => todo.id !== id));
	};


	const todoTitle = useRef('');


	return (
		<ColorSchemeProvider
			colorScheme={colorScheme}
			toggleColorScheme={toggleColorScheme}>
			<MantineProvider
				theme={{ colorScheme, defaultRadius: 'md' }}
				withGlobalStyles
				withNormalizeCSS>
				<div className='App'>
					<Modal
						opened={opened}
						size={'md'}
						title={'New Task'}
						withCloseButton={false}
						onClose={() => {
							setOpened(false);
						}}
						centered>
						<TextInput
							mt={'md'}
							ref={todoTitle}
							placeholder={'Task Title'}
							required
							label={'Title'}
						/>
						<Group mt={'md'} position={'apart'}>
							<Button
								onClick={() => {
									setOpened(false);
								}}
								variant={'subtle'}>
								Cancel
							</Button>
							<Button
								onClick={() => {
									addTodo();
									setOpened(false);
								}}>
								Create Task
							</Button>
						</Group>
					</Modal>
					<Container size={550} my={40}>
						<Group position={'apart'}>
							<Title
								sx={theme => ({
									fontFamily: `Greycliff CF, ${theme.fontFamily}`,
									fontWeight: 900,
								})}>
								Simple Todo App
							</Title>
							<ActionIcon
								color={'blue'}
								onClick={() => toggleColorScheme()}
								size='lg'>
								{colorScheme === 'dark' ? (
									<Sun size={16} />
								) : (
									<MoonStars size={16} />
								)}
							</ActionIcon>
						</Group>
						{todos.length > 0 ? (
							todos.map((todo) => {
								if (todo.title) {
									return (
										<Card withBorder key={todo.id} mt={'sm'}>
											<Group position={'apart'}>
												<Text weight={'bold'}>{todo.title}</Text>
												<Group justify="right">
													<Tooltip label="Toggle task completion">
														<Switch
															checked={todo.completed}
															onChange={() => {
																toggleComplete(todo)
															}}
															variant={'transparent'} data-testid={`complete-todo-${todo.id}`}>
														</Switch>
													</Tooltip>
													<ActionIcon
														onClick={() => {
															deleteTodo(todo.id)
														}}
														color={'red'}
														variant={'transparent'} data-testid={`delete-todo-${todo.id}`}>
														<Trash />
													</ActionIcon>
												</Group>
											</Group>


										</Card>
									);
								}
								return null;
							})
						) : (
							<Text size={'lg'} mt={'md'} color={'dimmed'}>
								You have no todos
							</Text>
						)}
						<Button
							onClick={() => {
								setOpened(true);
							}}
							fullWidth
							mt={'md'}>
							New Task
						</Button>
					</Container>
				</div>
			</MantineProvider>
		</ColorSchemeProvider>
	);
}
