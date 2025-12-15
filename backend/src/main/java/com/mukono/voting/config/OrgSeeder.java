package com.mukono.voting.config;

import com.mukono.voting.model.common.RecordStatus;
import com.mukono.voting.model.org.Archdeaconry;
import com.mukono.voting.model.org.Diocese;
import com.mukono.voting.model.org.Fellowship;
import com.mukono.voting.repository.org.ArchdeaconryRepository;
import com.mukono.voting.repository.org.DioceseRepository;
import com.mukono.voting.repository.org.FellowshipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * OrgSeeder initializes Mukono Diocese organization master data on startup.
 * Idempotent: safe to run multiple times without creating duplicates.
 */
@Component
public class OrgSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OrgSeeder.class);

    private final DioceseRepository dioceseRepository;
    private final ArchdeaconryRepository archdeaconryRepository;
    private final FellowshipRepository fellowshipRepository;

    public OrgSeeder(DioceseRepository dioceseRepository,
                     ArchdeaconryRepository archdeaconryRepository,
                     FellowshipRepository fellowshipRepository) {
        this.dioceseRepository = dioceseRepository;
        this.archdeaconryRepository = archdeaconryRepository;
        this.fellowshipRepository = fellowshipRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Starting organization data seeding...");

        int diocesesCreated = 0;
        int archdeaconriesCreated = 0;
        int fellowshipsCreated = 0;

        // 1. Seed Mukono Diocese
        boolean dioceseIsNew = seedMukonoDiocese();
        if (dioceseIsNew) {
            diocesesCreated++;
        }
        Diocese mukonoDiocese = dioceseRepository.findByNameIgnoreCase("Mukono Diocese").orElseThrow();

        // 2. Seed 12 Archdeaconries under Mukono Diocese
        archdeaconriesCreated = seedArchdeaconries(mukonoDiocese);

        // 3. Seed Default Fellowships
        fellowshipsCreated = seedFellowships();

        log.info("Organization seeding completed: {} diocese(s), {} archdeaconry/ies, {} fellowship(s) created",
                diocesesCreated, archdeaconriesCreated, fellowshipsCreated);
    }

    private boolean seedMukonoDiocese() {
        String name = "Mukono Diocese";
        String code = "MUKONO";

        // Check if exists
        if (dioceseRepository.findByNameIgnoreCase(name).isPresent()) {
            return false; // Already exists
        }

        Diocese diocese = new Diocese();
        diocese.setName(name);
        diocese.setCode(code);
        diocese.setStatus(RecordStatus.ACTIVE);
        dioceseRepository.save(diocese);
        log.debug("Created diocese: {}", name);
        return true;
    }

    private int seedArchdeaconries(Diocese diocese) {
        List<String> archdeaconryNames = Arrays.asList(
                "Cathedral Deanery",
                "Seeta Archdeaconry",
                "Bukoba Archdeaconry",
                "Nasuuti Archdeaconry",
                "Lugazi Archdeaconry",
                "Ndeeba Archdeaconry",
                "Kangulumira Archdeaconry",
                "Ngogwe Archdeaconry",
                "Nakibizzi Archdeaconry",
                "Mpumu Archdeaconry",
                "Bbaale Archdeaconry",
                "Kasawo Archdeaconry"
        );

        int created = 0;
        for (String name : archdeaconryNames) {
            // Check if exists under this diocese
            if (archdeaconryRepository.findByDioceseIdAndNameIgnoreCase(diocese.getId(), name).isEmpty()) {
                Archdeaconry archdeaconry = new Archdeaconry();
                archdeaconry.setDiocese(diocese);
                archdeaconry.setName(name);
                archdeaconry.setStatus(RecordStatus.ACTIVE);
                archdeaconryRepository.save(archdeaconry);
                log.debug("Created archdeaconry: {}", name);
                created++;
            }
        }
        return created;
    }

    private int seedFellowships() {
        List<String> fellowshipNames = Arrays.asList(
                "Mothers Union",
                "Fathers Union",
                "Christian Women's Fellowship",
                "Christian Men's Fellowship",
                "Youth Fellowship",
                "Children's Fellowship"
        );

        int created = 0;
        for (String name : fellowshipNames) {
            // Check if exists
            if (!fellowshipRepository.existsByNameIgnoreCase(name)) {
                Fellowship fellowship = new Fellowship();
                fellowship.setName(name);
                fellowship.setStatus(RecordStatus.ACTIVE);
                fellowshipRepository.save(fellowship);
                log.debug("Created fellowship: {}", name);
                created++;
            }
        }
        return created;
    }
}
