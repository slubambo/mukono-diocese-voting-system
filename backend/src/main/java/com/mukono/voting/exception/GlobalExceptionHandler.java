package com.mukono.voting.exception;

import com.mukono.voting.payload.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                message.isEmpty() ? "Validation failed" : message,
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle authentication failures
     */
    @ExceptionHandler({UsernameNotFoundException.class, BadCredentialsException.class})
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            Exception ex,
            HttpServletRequest request) {
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Invalid username or password",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle database constraint violations (e.g., foreign key constraints)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {
        
        logger.error("DataIntegrityViolationException occurred at {}: ", request.getRequestURI(), ex);
        
        String message = "Cannot perform this operation due to data integrity constraints";
        
        // Check the cause for more specific error messages
        Throwable cause = ex.getCause();
        String exceptionMessage = ex.getMessage();
        
        if (exceptionMessage != null) {
            // Handle specific table/constraint violations
            if (exceptionMessage.contains("election_applicants")) {
                message = "Cannot delete this election position because there are applicants associated with it. Please remove all applicants first.";
            } else if (exceptionMessage.contains("election_positions")) {
                message = "Cannot delete this record because it has election positions associated with it. Please remove the positions first.";
            } else if (exceptionMessage.contains("leadership_assignments")) {
                message = "Cannot delete this record because it has leadership assignments associated with it. Please remove the assignments first.";
            } else if (exceptionMessage.contains("fellowship_positions")) {
                message = "Cannot delete this record because it has fellowship positions associated with it. Please remove the positions first.";
            } else if (exceptionMessage.contains("Cannot delete or update a parent row")) {
                message = "Cannot delete this record because it is being used by other records in the system. Please remove or update the dependent records first.";
            } else if (exceptionMessage.contains("foreign key constraint")) {
                message = "Cannot perform this operation because the record is being referenced by other data in the system";
            } else if (exceptionMessage.contains("Duplicate entry")) {
                // Extract field name if possible
                if (exceptionMessage.contains("for key")) {
                    message = "A record with this information already exists in the system";
                } else {
                    message = "This record already exists in the system";
                }
            } else if (exceptionMessage.contains("uk_") || exceptionMessage.contains("UK_")) {
                message = "A record with this unique information already exists";
            }
        }
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                message,
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle IllegalArgumentException for business logic validation errors
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request) {
        
        logger.warn("IllegalArgumentException occurred at {}: {}", request.getRequestURI(), ex.getMessage());
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage() != null ? ex.getMessage() : "Invalid request parameters",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle all other runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex,
            HttpServletRequest request) {
        
        logger.error("RuntimeException occurred at {}: ", request.getRequestURI(), ex);
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Handle generic exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {
        
        logger.error("Exception occurred at {}: ", request.getRequestURI(), ex);
        
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
