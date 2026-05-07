package com.codesolutions.pmt.controller;

import com.codesolutions.pmt.dto.AuthDto;
import com.codesolutions.pmt.dto.ProjectDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import jakarta.annotation.PostConstruct;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ApiIntegrationTest {

    @Autowired private WebApplicationContext wac;
    @Autowired private ObjectMapper objectMapper;

    private MockMvc mvc;

    @PostConstruct
    void init() {
        this.mvc = MockMvcBuilders.webAppContextSetup(wac).build();
    }

    @Test
    void fullFlow_register_login_createProject_inviteMember() throws Exception {
        // 1. Register alice
        AuthDto.RegisterRequest reg = new AuthDto.RegisterRequest(
                "alice", "alice@it.com", "password");
        MvcResult r1 = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthDto.UserResponse alice = objectMapper.readValue(
                r1.getResponse().getContentAsString(), AuthDto.UserResponse.class);

        // 2. Register bob
        AuthDto.RegisterRequest regBob = new AuthDto.RegisterRequest(
                "bob", "bob@it.com", "password");
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regBob)))
                .andExpect(status().isCreated());

        // 3. Login alice
        AuthDto.LoginRequest login = new AuthDto.LoginRequest("alice@it.com", "password");
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@it.com"));

        // 4. Create project
        ProjectDto.CreateRequest pr = new ProjectDto.CreateRequest("P1", "desc");
        MvcResult r2 = mvc.perform(post("/api/projects")
                        .header("X-User-Id", alice.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pr)))
                .andExpect(status().isCreated())
                .andReturn();

        ProjectDto.Response project = objectMapper.readValue(
                r2.getResponse().getContentAsString(), ProjectDto.Response.class);
        assertThat(project.name()).isEqualTo("P1");

        // 5. List projects alice
        mvc.perform(get("/api/projects").header("X-User-Id", alice.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // 6. Invite bob
        ProjectDto.InviteRequest invite = new ProjectDto.InviteRequest(
                "bob@it.com", com.codesolutions.pmt.entity.Role.MEMBER);
        mvc.perform(post("/api/projects/" + project.id() + "/members")
                        .header("X-User-Id", alice.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invite)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("bob"));

        // 7. List members
        mvc.perform(get("/api/projects/" + project.id() + "/members")
                        .header("X-User-Id", alice.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void register_invalidEmail_badRequest() throws Exception {
        AuthDto.RegisterRequest bad = new AuthDto.RegisterRequest(
                "charlie", "not-an-email", "password");
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void project_notMember_forbidden() throws Exception {
        AuthDto.RegisterRequest reg = new AuthDto.RegisterRequest(
                "dave", "dave@it.com", "password");
        MvcResult r = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andReturn();
        AuthDto.UserResponse dave = objectMapper.readValue(
                r.getResponse().getContentAsString(), AuthDto.UserResponse.class);

        mvc.perform(get("/api/projects/9999").header("X-User-Id", dave.id()))
                .andExpect(status().isNotFound());
    }
}
