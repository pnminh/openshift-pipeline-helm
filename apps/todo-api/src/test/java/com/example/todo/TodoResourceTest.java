package com.example.todo;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
public class TodoResourceTest {

    @Inject
    TodoRepository todoRepository;

    @BeforeEach
    @Transactional
    void setup() {
        todoRepository.deleteAll();
    }

    @Test
    public void testGetAllTodos() {
        given()
                .when().get("/todos")
                .then()
                .statusCode(200)
                .body("$.size()", is(0));
    }

    @Test
    public void testCreateTodo() {
        Todo todo = new Todo();
        todo.setTitle("Write unit tests");
        todo.setCompleted(false);

        given()
                .contentType(ContentType.JSON)
                .body(todo)
                .when().post("/todos")
                .then()
                .statusCode(200)
                .body("title", is("Write unit tests"))
                .body("completed", is(false));

        given()
                .when().get("/todos")
                .then()
                .statusCode(200)
                .body("$.size()", is(1))
                .body("[0].title", is("Write unit tests"))
                .body("[0].completed", is(false));
        ;

        List<Todo> todos = todoRepository.listAll();
        assert (todos.size() == 1);
        assert (todos.get(0).getTitle().equals("Write unit tests"));
        assert (!todos.get(0).isCompleted());
    }

    @Test
    public void testUpdateTodo() {
        Long todoId = createTodo();
        Todo updatedTodo = new Todo();
        updatedTodo.setTitle("Write more unit tests");
        updatedTodo.setCompleted(true);
        given()
                .contentType(ContentType.JSON)
                .body(updatedTodo)
                .when().put("/todos/" + todoId)
                .then()
                .statusCode(200)
                .body("title", is("Write more unit tests"))
                .body("completed", is(true));

        Todo retrievedTodo = todoRepository.findById(todoId);
        assert (retrievedTodo.getTitle().equals("Write more unit tests"));
        assert (retrievedTodo.isCompleted());
    }

    @Transactional
    protected Long createTodo() {
        Todo todo = new Todo();
        todo.setTitle("Write unit tests");
        todo.setCompleted(false);
        todoRepository.persist(todo);
        return todo.getId();
    }

    @Test
    public void testDeleteTodo() {
        Long todoId = createTodo();
        given()
                .when().delete("/todos/" + todoId)
                .then()
                .statusCode(204);

        Todo deletedTodo = todoRepository.findById(todoId);
        assert (deletedTodo == null);
    }
}