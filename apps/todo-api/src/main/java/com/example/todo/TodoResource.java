package com.example.todo;

import java.util.List;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;

@Path("/todos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TodoResource {

    @Inject
    TodoRepository todoRepository;

    @GET
    public List<Todo> getAll() {
        return todoRepository.listAll();
    }

    @POST
    @Transactional
    public Todo create(Todo todo) {
        todoRepository.persist(todo);
        return todo;
    }

    @PUT
    @Path("{id}")
    @Transactional
    public Todo update(@PathParam("id") Long id, Todo todo) {
        List<Todo> entities = todoRepository.listAll();
        Todo entity = todoRepository.findById(id);
        if (entity == null) {
            throw new WebApplicationException("Todo with id of " + id + " does not exist.", 404);
        }
        entity.setTitle(todo.getTitle());
        entity.setCompleted(todo.isCompleted());
        return entity;
    }

    @DELETE
    @Path("{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        Todo entity = todoRepository.findById(id);
        if (entity == null) {
            throw new WebApplicationException("Todo with id of " + id + " does not exist.", 404);
        }
        todoRepository.delete(entity);
    }
}