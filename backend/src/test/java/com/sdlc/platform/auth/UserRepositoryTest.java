package com.sdlc.platform.auth;

import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private Role developerRole;

    @BeforeEach
    void setUp() {
        developerRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Developer role")));
    }

    @Test
    void saveAndFindUser_succeeds() {
        User user = new User("dev@example.com", "devuser", "$2a$10$hashedPassword", "Dev User");
        user.addRole(developerRole);

        User saved = userRepository.save(user);

        assertNotNull(saved.getId());
        assertEquals("dev@example.com", saved.getEmail());
        assertTrue(saved.getRoles().contains(developerRole));

        Optional<User> byUsername = userRepository.findByUsernameIgnoreCase("DEVUSER");
        assertTrue(byUsername.isPresent());
        assertEquals("devuser", byUsername.get().getUsername());

        Optional<User> byEmail = userRepository.findByEmailIgnoreCase("DEV@EXAMPLE.COM");
        assertTrue(byEmail.isPresent());
        assertEquals("dev@example.com", byEmail.get().getEmail());
    }

    @Test
    void existsByEmailAndUsername_caseInsensitive() {
        User user = new User("alice@example.com", "alice", "$2a$10$hashedPassword", "Alice Smith");
        user.addRole(developerRole);
        userRepository.save(user);

        assertTrue(userRepository.existsByEmailIgnoreCase("ALICE@EXAMPLE.COM"));
        assertTrue(userRepository.existsByUsernameIgnoreCase("ALICE"));
        assertFalse(userRepository.existsByEmailIgnoreCase("bob@example.com"));
        assertFalse(userRepository.existsByUsernameIgnoreCase("bob"));
    }

    @Test
    void userToString_doesNotContainPassword() {
        User user = new User("secure@example.com", "secureuser", "superSecretPassword123!", "Secure User");
        String output = user.toString();

        assertFalse(output.contains("superSecretPassword123!"));
        assertFalse(output.contains("passwordHash"));
    }
}
