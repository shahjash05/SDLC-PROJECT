package com.sdlc.platform.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdlc.platform.auth.dto.LoginRequest;
import com.sdlc.platform.auth.dto.RegisterRequest;
import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void setUp() {
        if (roleRepository.findByName(RoleName.ROLE_DEVELOPER).isEmpty()) {
            roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Developer role"));
        }
    }

    @Test
    void register_withValidData_returns201AndJwtTokenWithDefaultRole() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "jane.dev@example.com",
                "janedev",
                "Jane Developer",
                "securePassword123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("jane.dev@example.com"))
                .andExpect(jsonPath("$.data.user.username").value("janedev"))
                .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_DEVELOPER")));
    }

    @Test
    void register_withDuplicateEmail_returns409Conflict() throws Exception {
        RegisterRequest first = new RegisterRequest(
                "duplicate@example.com",
                "user1",
                "User One",
                "securePassword123!"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        RegisterRequest second = new RegisterRequest(
                "duplicate@example.com",
                "user2",
                "User Two",
                "securePassword123!"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void register_withInvalidPassword_returns400ValidationFailed() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "short@example.com",
                "shortpass",
                "Short Pass",
                "short" // less than 8 characters
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void login_withValidCredentials_returns200AndToken() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "login.test@example.com",
                "logintester",
                "Login Tester",
                "validPassword123!"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login with email
        LoginRequest emailLogin = new LoginRequest("login.test@example.com", "validPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.user.username").value("logintester"));

        // Login with username
        LoginRequest usernameLogin = new LoginRequest("logintester", "validPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(usernameLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void login_withWrongPassword_returns401GenericError() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "wrongpass@example.com",
                "wrongpassuser",
                "Wrong Pass User",
                "correctPassword123!"
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest wrongLogin = new LoginRequest("wrongpassuser", "incorrectPass!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid username/email or password."));
    }

    @Test
    void login_withNonExistentUser_returns401GenericError() throws Exception {
        LoginRequest nonExistent = new LoginRequest("ghost@example.com", "anyPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nonExistent)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid username/email or password."));
    }

    @Test
    void getCurrentUser_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void getCurrentUser_withValidJwt_returns200AndUserProfile() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "me.test@example.com",
                "metester",
                "Me Tester",
                "validPassword123!"
        );
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("me.test@example.com"))
                .andExpect(jsonPath("$.data.username").value("metester"))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_DEVELOPER")));
    }
}
