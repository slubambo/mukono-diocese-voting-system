package com.mukono.voting.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "roles")
public class Role {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(length = 50, unique = true, nullable = false)
	private RoleName name;

	public enum RoleName {
		ROLE_ADMIN, ROLE_DS, ROLE_BISHOP, ROLE_SENIOR_STAFF, ROLE_POLLING_OFFICER, ROLE_VOTER
	}

	public Role() {
		super();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public RoleName getName() {
		return name;
	}

	public void setName(RoleName name) {
		this.name = name;
	}

}
