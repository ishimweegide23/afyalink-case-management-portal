package com.afyalink.backend.util;

import com.afyalink.backend.exception.BadRequestException;
import lombok.Getter;

import java.time.LocalDate;

/**
 * Validates analytics/report date ranges.
 * Future dates throw; periods entirely before system start return empty-data result.
 */
public final class DateRangeValidator {

    public static final LocalDate SYSTEM_START_DATE = LocalDate.of(2025, 1, 1);

    private DateRangeValidator() {}

    @Getter
    public static class Result {
        private final LocalDate start;
        private final LocalDate end;
        private final boolean noDataInRange;
        private final String warningMessage;

        public Result(LocalDate start, LocalDate end, boolean noDataInRange, String warningMessage) {
            this.start = start;
            this.end = end;
            this.noDataInRange = noDataInRange;
            this.warningMessage = warningMessage;
        }
    }

    /** Throws {@link BadRequestException} on invalid/future ranges (API controllers). */
    public static void validate(LocalDate start, LocalDate end) {
        validateForQuery(start, end, true);
    }

    /** Returns adjusted range; may flag {@code noDataInRange} for pre-system periods (services). */
    public static Result validateForQuery(LocalDate start, LocalDate end) {
        return validateForQuery(start, end, false);
    }

    private static Result validateForQuery(LocalDate start, LocalDate end, boolean throwOnInvalid) {
        LocalDate today = LocalDate.now();

        if (start == null || end == null) {
            if (throwOnInvalid) {
                throw new BadRequestException("Start date and end date are required");
            }
            return new Result(SYSTEM_START_DATE, today, true, "Date range is required.");
        }

        if (start.isAfter(today)) {
            String msg = String.format(
                    "Cannot query future dates. Start date '%s' is in the future. Please select %s or earlier.",
                    start, today);
            if (throwOnInvalid) throw new BadRequestException(msg);
            return new Result(start, end, true, msg);
        }

        // Cap period end to today (e.g. May 2026 → through May 26, not May 31)
        end = end.isAfter(today) ? today : end;

        if (start.isAfter(end)) {
            String msg = "Start date cannot be after end date";
            if (throwOnInvalid) throw new BadRequestException(msg);
            return new Result(start, end, true, msg);
        }

        if (end.isBefore(SYSTEM_START_DATE)) {
            return new Result(
                    start,
                    end,
                    true,
                    String.format(
                            "No data available for period ending %s. AfyaLink system started operations on %s.",
                            end, SYSTEM_START_DATE)
            );
        }

        LocalDate effectiveStart = start;
        String warning = null;
        if (start.isBefore(SYSTEM_START_DATE)) {
            effectiveStart = SYSTEM_START_DATE;
            warning = String.format(
                    "Showing data from %s onwards. No records exist before this date.",
                    SYSTEM_START_DATE);
        }

        int year = start.getYear();
        if (year < 2000 || year > today.getYear() + 1) {
            String msg = String.format(
                    "Year %d is outside valid range (2000-%d). Please select a valid year.",
                    year, today.getYear());
            if (throwOnInvalid) throw new BadRequestException(msg);
            return new Result(start, end, true, msg);
        }

        return new Result(effectiveStart, end, false, warning);
    }
}
