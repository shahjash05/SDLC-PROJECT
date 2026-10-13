package com.sdlc.platform.auth.service;

import com.sdlc.platform.auth.dto.AuthResponse;
import com.sdlc.platform.auth.dto.LoginRequest;
import com.sdlc.platform.auth.dto.RegisterRequest;
import com.sdlc.platform.auth.dto.UserSummaryDto;
import com.sdlc.platform.auth.model.Role;
import com.sdlc.platform.auth.model.RoleName;
import com.sdlc.platform.auth.model.User;
import com.sdlc.platform.auth.repository.RoleRepository;
import com.sdlc.platform.auth.repository.UserRepository;
import com.sdlc.platform.common.DuplicateResourceException;
import com.sdlc.platform.config.JwtProperties;
import com.sdlc.platform.security.JwtTokenProvider;
import com.sdlc.platform.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user registration, authentication, and profile retrieval.
 * All public registrations default strictly to ROLE_DEVELOPER.
 * Generic credential errors are returned on login failure to prevent username enumeration.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new DuplicateResourceException("This username is already taken.");
        }

        Role defaultRole = roleRepository.findByName(RoleName.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_DEVELOPER, "Student or developer team member")));

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getEmail().trim().toLowerCase(),
                request.getUsername().trim(),
                encodedPassword,
                request.getFullName().trim()
        );
        user.addRole(defaultRole);

        User savedUser = userRepository.save(user);
        log.info("Registered new user [{}] with role [{}]", savedUser.getUsername(), defaultRole.getName());

        String token = jwtTokenProvider.generateToken(savedUser);
        return AuthResponse.of(token, jwtProperties.getExpirationMs(), UserSummaryDto.fromEntity(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail().trim();

        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username/email or password.");
        }

        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled. Please contact an administrator.");
        }

        log.info("User [{}] authenticated successfully", user.getUsername());

        String token = jwtTokenProvider.generateToken(user);
        return AuthResponse.of(token, jwtProperties.getExpirationMs(), UserSummaryDto.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + principal.getId()));

        return UserSummaryDto.fromEntity(user);
    }
}
