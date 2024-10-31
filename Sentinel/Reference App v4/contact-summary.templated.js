/* eslint-disable indent */
// @ts-nocheck
const moment = require('moment');
const extras = require('./contact-summary-extras');
const {
  MAX_DAYS_IN_PREGNANCY,
  VACCINES,
  countANCFacilityVisits,
  getAllRiskFactorExtra,
  getAllRiskFactors,
  getDeliveryDate,
  getField,
  getFormArraySubmittedInWindow,
  getFormattedDate,
  getLatestDangerSignsForPregnancy,
  getMostRecentEDDForPregnancy,
  getMostRecentLMPDateForPregnancy,
  getNewestReport,
  getNextANCVisitDate,
  getNextImmDate,
  getRecentANCVisitWithEvent,
  getSubsequentDeliveries,
  getSubsequentPregnancyFollowUps,
  getVaccinesReceived,
  getYearsPast,
  isActivePregnancy,
  isAlive,
  isFullyImmunized,
  isHighRiskPregnancy,
  isReadyForDelivery,
  isReadyForNewPregnancy,
  now,
  today,
  DAYS_IN_YEAR,
  getAppointmentDateFromLastTraceReport,
  getMostRecentEnrollment,
  getNcds,
  getSubsequentTraceReports,
  getTBTestResult,
  getTraceReasonsFromLastTraceReport,
  getTreatmentDuration,
  getTreatmentProgramId,
  isContactTraceReferred,
} = extras;

//contact, allReports, lineage are globally available for contact-summary
const thisContact = contact;
const thisLineage = lineage;
const allReports = reports;
const context = {
  alive: isAlive(thisContact),
  muted: false,
  show_pregnancy_form: isReadyForNewPregnancy(thisContact, allReports),
  show_delivery_form: isReadyForDelivery(thisContact, allReports),
};

const fields = [
  {
    appliesToType: 'person',
    label: 'patient_id',
    value: thisContact.patient_id,
    width: 4,
  },
  {
    appliesToType: 'person',
    label: 'contact.age',
    value: thisContact.date_of_birth,
    width: 4,
    filter: 'age',
  },
  {
    appliesToType: 'person',
    label: 'contact.sex',
    value: 'contact.sex.' + thisContact.sex,
    translate: true,
    width: 4,
  },
  {
    appliesToType: 'person',
    label: 'person.field.phone',
    value: thisContact.phone,
    width: 4,
  },
  {
    appliesToType: 'person',
    label: 'person.field.alternate_phone',
    value: thisContact.phone_alternate,
    width: 4,
  },
  {
    appliesToType: 'person',
    label: 'External ID',
    value: thisContact.external_id,
    width: 4,
  },
  {
    appliesToType: 'person',
    label: 'contact.parent',
    value: thisLineage,
    filter: 'lineage',
  },
  {
    appliesToType: '!person',
    label: 'contact',
    value: thisContact.contact && thisContact.contact.name,
    width: 4,
  },
  {
    appliesToType: '!person',
    label: 'contact.phone',
    value: thisContact.contact && thisContact.contact.phone,
    width: 4,
  },
  {
    appliesToType: '!person',
    label: 'External ID',
    value: thisContact.external_id,
    width: 4,
  },
  {
    appliesToType: '!person',
    appliesIf: function () {
      return thisContact.parent && thisLineage[0];
    },
    label: 'contact.parent',
    value: thisLineage,
    filter: 'lineage',
  },
  {
    appliesToType: 'person',
    label: 'contact.notes',
    value: thisContact.notes,
    width: 12,
  },
  {
    appliesToType: '!person',
    label: 'contact.notes',
    value: thisContact.notes,
    width: 12,
  },
];

if (thisContact.short_name) {
  fields.unshift({
    appliesToType: 'person',
    label: 'contact.short_name',
    value: thisContact.short_name,
    width: 4,
  });
}

const cards = [
  {
    label: 'contact.profile.pregnancy.active',
    appliesToType: 'report',
    appliesIf: function (report) {
      return isActivePregnancy(thisContact, allReports, report);
    },
    fields: function (report) {
      const fields = [];
      const riskFactors = getAllRiskFactors(allReports, report);
      const riskFactorsCustom = getAllRiskFactorExtra(allReports, report);
      //if (riskFactorCustom) { riskFactors.push(riskFactorCustom); }
      const dangerSigns = getLatestDangerSignsForPregnancy(allReports, report);

      const highRisk = isHighRiskPregnancy(allReports, report);

      const mostRecentANC = getNewestReport(allReports, [
        'pregnancy',
        'pregnancy_home_visit',
      ]);
      const mostRecentANCDate = moment(mostRecentANC.reported_date);
      const lmp_date = getMostRecentLMPDateForPregnancy(allReports, report);
      const edd_ms = getMostRecentEDDForPregnancy(allReports, report);
      const nextAncVisitDate = getNextANCVisitDate(allReports, report);
      const weeksPregnant = lmp_date ? today.diff(lmp_date, 'weeks') : null;
      let lmp_approx = getField(report, 'lmp_approx');
      let reportDate = report.reported_date;
      getSubsequentPregnancyFollowUps(allReports, report).forEach(function (
        followUpReport
      ) {
        //check if LMP was updated
        if (
          followUpReport.reported_date > reportDate &&
          getField(followUpReport, 'lmp_updated') === 'yes'
        ) {
          reportDate = followUpReport.reported_date;
          if (getField(followUpReport, 'lmp_method_approx')) {
            lmp_approx = getField(followUpReport, 'lmp_method_approx');
          }
        }
      });

      const migratedReport = getRecentANCVisitWithEvent(
        allReports,
        report,
        'migrated'
      );
      const refusedReport = getRecentANCVisitWithEvent(
        allReports,
        report,
        'refused'
      );
      const stopReport = migratedReport || refusedReport;
      if (stopReport) {
        const clearAll =
          getField(stopReport, 'pregnancy_ended.clear_option') === 'clear_all';
        fields.push(
          {
            label: 'contact.profile.change_care',
            value: migratedReport ? 'Migrated out of area' : 'Refusing care',
            width: 6,
          },
          {
            label: 'contact.profile.tasks_on_off',
            value: clearAll ? 'Off' : 'On',
            width: 6,
          }
        );
      }
      fields.push(
        {
          label: 'Weeks Pregnant',
          value:
            weeksPregnant || weeksPregnant === 0
              ? { number: weeksPregnant, approximate: lmp_approx === 'yes' }
              : 'contact.profile.value.unknown',
          translate: !weeksPregnant && weeksPregnant !== 0,
          filter: weeksPregnant || weeksPregnant === 0 ? 'weeksPregnant' : '',
          width: 6,
        },
        {
          label: 'contact.profile.edd',
          value: edd_ms ? edd_ms.valueOf() : 'contact.profile.value.unknown',
          translate: !edd_ms,
          filter: edd_ms ? 'simpleDate' : '',
          width: 6,
        }
      );

      if (highRisk) {
        let riskValue = '';
        if (!riskFactors && riskFactorsCustom) {
          riskValue = riskFactorsCustom.join(', ');
        } else if (
          riskFactors.length > 1 ||
          (riskFactors && riskFactorsCustom)
        ) {
          riskValue = 'contact.profile.risk.multiple';
        } else {
          riskValue = 'contact.profile.danger_sign.' + riskFactors[0];
        }
        fields.push({
          label: 'contact.profile.risk.high',
          value: riskValue,
          translate: true,
          icon: 'icon-risk',
          width: 6,
        });
      }

      if (dangerSigns.length > 0) {
        fields.push({
          label: 'contact.profile.danger_signs.current',
          value:
            dangerSigns.length > 1
              ? 'contact.profile.danger_sign.multiple'
              : 'contact.profile.danger_sign.' + dangerSigns[0],
          translate: true,
          width: 6,
        });
      }

      fields.push(
        {
          label: 'contact.profile.visit',
          value: 'contact.profile.visits.of',
          context: {
            count: countANCFacilityVisits(allReports, report),
            total: 8,
          },
          translate: true,
          width: 6,
        },
        {
          label: 'contact.profile.last_visited',
          value: mostRecentANCDate.valueOf(),
          filter: 'relativeDay',
          width: 6,
        }
      );

      if (nextAncVisitDate && nextAncVisitDate.isSameOrAfter(today)) {
        fields.push({
          label: 'contact.profile.anc.next',
          value: nextAncVisitDate.valueOf(),
          filter: 'simpleDate',
          width: 6,
        });
      }

      return fields;
    },
    modifyContext: function (ctx, report) {
      let lmpDate = getField(report, 'lmp_date_8601');
      let lmpMethodApprox = getField(report, 'lmp_method_approx');
      let hivTested = getField(report, 'hiv_status_known');
      let dewormingMedicationReceived = getField(
        report,
        'deworming_med_received'
      );
      let ttReceived = getField(report, 'tt_received');
      const riskFactorCodes = getAllRiskFactors(allReports, report);
      const riskFactorsCustom = getAllRiskFactorExtra(allReports, report);
      let pregnancyFollowupDateRecent = getField(
        report,
        't_pregnancy_follow_up_date'
      );

      const followUps = getSubsequentPregnancyFollowUps(allReports, report);
      followUps.forEach(function (followUpReport) {
        if (getField(followUpReport, 'lmp_updated') === 'yes') {
          lmpDate = getField(followUpReport, 'lmp_date_8601');
          lmpMethodApprox = getField(followUpReport, 'lmp_method_approx');
        }
        hivTested = getField(followUpReport, 'hiv_status_known');
        dewormingMedicationReceived = getField(
          followUpReport,
          'deworming_med_received'
        );
        ttReceived = getField(followUpReport, 'tt_received');
        if (getField(followUpReport, 't_pregnancy_follow_up') === 'yes') {
          pregnancyFollowupDateRecent = getField(
            followUpReport,
            't_pregnancy_follow_up_date'
          );
        }
      });
      ctx.lmp_date_8601 = lmpDate;
      ctx.lmp_method_approx = lmpMethodApprox;
      ctx.is_active_pregnancy = true;
      ctx.deworming_med_received = dewormingMedicationReceived;
      ctx.hiv_tested_past = hivTested;
      ctx.tt_received_past = ttReceived;
      ctx.risk_factor_codes = riskFactorCodes.join(' ');
      ctx.risk_factor_extra = riskFactorsCustom.join('; ');
      ctx.pregnancy_follow_up_date_recent = pregnancyFollowupDateRecent;
      ctx.pregnancy_uuid = report._id;
    },
  },
  {
    label: 'contact.profile.immunizations',
    appliesToType: 'person',
    appliesIf: () => {
      return getYearsPast(new Date(contact.date_of_birth), new Date(now)) < 5;
    },
    fields: () => {
      const fields = [];
      const vaccinations = getVaccinesReceived(allReports);
      const newestImmVisit = getNewestReport(allReports, ['immunization']);
      const newestScreening = getNewestReport(allReports, [
        'under_5_screening',
      ]);
      if (vaccinations.length > 0) {
        let nextImmunizationDate = '';
        if (newestImmVisit.created_by_doc === newestScreening._id) {
          nextImmunizationDate = getNextImmDate(newestScreening);
        }
        fields.push({
          label: 'contact.profile.immunization.confirmed',
          value: Array.from(new Set(vaccinations)).join(),
          width: 12,
        });

        if (!isFullyImmunized(allReports)) {
          fields.push({
            label: 'contact.profile.immunization.next_visit',
            value: nextImmunizationDate
              ? getFormattedDate(nextImmunizationDate)
              : 'contact.profile.not-applicable',
            width: 12,
          });
        }

        fields.push({
          label: 'contact.profile.immunization.fully_immunized',
          value:
            'contact.profile.immunization.fully_immunized.' +
            (isFullyImmunized(allReports) ? 'yes' : 'no'),
          translate: true,
        });
      } else {
        fields.push({
          label: 'contact.profile.immunization.confirmed',
          value: 'contact.profile.immunization.none',
          translate: true,
        });
      }
      return fields;
    },
    modifyContext: function (ctx) {
      const vaccinations = getVaccinesReceived(allReports);
      const newestImmVisit = getNewestReport(allReports, ['immunization']);
      const newestScreening = getNewestReport(allReports, [
        'under_5_screening',
      ]);
      let nextImmunizationDate = '';
      let vaccines = [];
      if (vaccinations.length > 0) {
        if (newestImmVisit.created_by_doc === newestScreening._id) {
          nextImmunizationDate = getNextImmDate(newestScreening);
        }
        vaccines = Array.from(new Set(vaccinations)).join();
      }
      ctx.last_visit_next_appointment_date = nextImmunizationDate;
      ctx.was_given_bcg = vaccines.includes(VACCINES.bcg) ? 'yes' : 'no';
      ctx.was_given_birth_polio = vaccines.includes(VACCINES.birth_polio)
        ? 'yes'
        : 'no';
      ctx.was_given_opv =
        vaccines.includes(VACCINES.opv_1) &&
        vaccines.includes(VACCINES.opv_2) &&
        vaccines.includes(VACCINES.opv_3)
          ? 'yes'
          : 'no';
      ctx.was_given_opv_1 = vaccines.includes(VACCINES.opv_1) ? 'yes' : 'no';
      ctx.was_given_opv_2 = vaccines.includes(VACCINES.opv_2) ? 'yes' : 'no';
      ctx.was_given_opv_3 = vaccines.includes(VACCINES.opv_3) ? 'yes' : 'no';
      ctx.was_given_pcv =
        vaccines.includes(VACCINES.pcv_1) &&
        vaccines.includes(VACCINES.pcv_2) &&
        vaccines.includes(VACCINES.pcv_3)
          ? 'yes'
          : 'no';
      ctx.was_given_pcv_1 = vaccines.includes(VACCINES.pcv_1) ? 'yes' : 'no';
      ctx.was_given_pcv_2 = vaccines.includes(VACCINES.pcv_2) ? 'yes' : 'no';
      ctx.was_given_pcv_3 = vaccines.includes(VACCINES.pcv_3) ? 'yes' : 'no';
      ctx.was_given_dpt_hepb_hib =
        vaccines.includes(VACCINES.dpt_hepb_hib_1) &&
        vaccines.includes(VACCINES.dpt_hepb_hib_2) &&
        vaccines.includes(VACCINES.dpt_hepb_hib_3)
          ? 'yes'
          : 'no';
      ctx.was_given_dpt_hepb_hib_1 = vaccines.includes(VACCINES.dpt_hepb_hib_1)
        ? 'yes'
        : 'no';
      ctx.was_given_dpt_hepb_hib_2 = vaccines.includes(VACCINES.dpt_hepb_hib_2)
        ? 'yes'
        : 'no';
      ctx.was_given_dpt_hepb_hib_3 = vaccines.includes(VACCINES.dpt_hepb_hib_3)
        ? 'yes'
        : 'no';
      ctx.was_given_ipv = vaccines.includes(VACCINES.ipv) ? 'yes' : 'no';
      ctx.was_given_rota =
        vaccines.includes(VACCINES.rota_1) && vaccines.includes(VACCINES.rota_2)
          ? 'yes'
          : 'no';
      ctx.was_given_rota_1 = vaccines.includes(VACCINES.rota_1) ? 'yes' : 'no';
      ctx.was_given_rota_2 = vaccines.includes(VACCINES.rota_2) ? 'yes' : 'no';
      ctx.was_given_vitamin_a = vaccines.includes(VACCINES.vitamin_a)
        ? 'yes'
        : 'no';
      ctx.was_given_measles =
        vaccines.includes(VACCINES.measles_1) &&
        vaccines.includes(VACCINES.measles_2)
          ? 'yes'
          : 'no';
      ctx.was_given_measles_1 = vaccines.includes(VACCINES.measles_1)
        ? 'yes'
        : 'no';
      ctx.was_given_measles_2 = vaccines.includes(VACCINES.measles_2)
        ? 'yes'
        : 'no';
      ctx.is_fully_immunized = isFullyImmunized(allReports);
    },
  },
  {
    label: 'contact.profile.death.title',
    appliesToType: 'person',
    appliesIf: function () {
      return !isAlive(thisContact);
    },
    fields: function () {
      const fields = [];
      let dateOfDeath;
      let placeOfDeath;
      const deathReport = getNewestReport(allReports, ['death_report']);
      if (deathReport) {
        const deathDetails = getField(deathReport, 'death_details');
        if (deathDetails) {
          dateOfDeath = deathDetails.date_of_death;
          placeOfDeath = deathDetails.place_of_death;
        }
      } else if (thisContact.date_of_death) {
        dateOfDeath = thisContact.date_of_death;
      }
      fields.push(
        {
          label: 'contact.profile.death.date',
          value: dateOfDeath ? dateOfDeath : 'contact.profile.value.unknown',
          filter: dateOfDeath ? 'simpleDate' : '',
          translate: dateOfDeath ? false : true,
          width: 6,
        },
        {
          label: 'contact.profile.death.place',
          value: placeOfDeath ? placeOfDeath : 'contact.profile.value.unknown',
          translate: true,
          width: 6,
        }
      );
      return fields;
    },
  },
  {
    label: 'contact.profile.pregnancy.past',
    appliesToType: 'report',
    appliesIf: function (report) {
      if (thisContact.type !== 'person') {
        return false;
      }
      if (report.form === 'delivery') {
        return true;
      }
      if (report.form === 'pregnancy') {
        //check if early end to pregnancy (miscarriage/abortion)
        if (
          getRecentANCVisitWithEvent(allReports, report, 'abortion') ||
          getRecentANCVisitWithEvent(allReports, report, 'miscarriage')
        ) {
          return true;
        }
        //check if 42 weeks past pregnancy and no delivery form submitted
        const lmpDate = getMostRecentLMPDateForPregnancy(allReports, report);
        return (
          lmpDate &&
          today.isSameOrAfter(lmpDate.clone().add(42, 'weeks')) &&
          getSubsequentDeliveries(allReports, report, MAX_DAYS_IN_PREGNANCY)
            .length === 0
        );
      }
      return false;
    },
    fields: function (report) {
      const fields = [];
      let relevantPregnancy;
      let dateOfDelivery;
      let placeOfDelivery = '';
      let babiesDelivered = 0;
      let babiesDeceased = 0;
      let ancFacilityVisits = 0;

      //if there was either a delivery, an early end to pregnancy or 42 weeks have passed
      if (report.form === 'delivery') {
        const deliveryReportDate = moment(report.reported_date);
        relevantPregnancy = getFormArraySubmittedInWindow(
          allReports,
          ['pregnancy'],
          deliveryReportDate
            .clone()
            .subtract(MAX_DAYS_IN_PREGNANCY, 'days')
            .toDate(),
          deliveryReportDate.toDate()
        )[0];

        //If there was a delivery
        if (getField(report, 'delivery_outcome')) {
          dateOfDelivery = getDeliveryDate(report);
          placeOfDelivery = getField(report, 'delivery_outcome.delivery_place');
          babiesDelivered = getField(
            report,
            'delivery_outcome.babies_delivered_num'
          );
          babiesDeceased = getField(
            report,
            'delivery_outcome.babies_deceased_num'
          );
          fields.push(
            {
              label: 'contact.profile.delivery_date',
              value: dateOfDelivery ? dateOfDelivery.valueOf() : '',
              filter: 'simpleDate',
              width: 6,
            },
            {
              label: 'contact.profile.delivery_place',
              value: placeOfDelivery,
              translate: true,
              width: 6,
            },
            {
              label: 'contact.profile.delivered_babies',
              value: babiesDelivered,
              width: 6,
            }
          );
        }
      }
      //if early end to pregnancy
      else if (report.form === 'pregnancy') {
        relevantPregnancy = report;
        const lmpDate = getMostRecentLMPDateForPregnancy(
          allReports,
          relevantPregnancy
        );
        const abortionReport = getRecentANCVisitWithEvent(
          allReports,
          relevantPregnancy,
          'abortion'
        );
        const miscarriageReport = getRecentANCVisitWithEvent(
          allReports,
          relevantPregnancy,
          'miscarriage'
        );
        const endReport = abortionReport || miscarriageReport;
        if (endReport) {
          let endReason = '';
          let endDate = moment(0);
          let weeksPregnantAtEnd = 0;
          if (abortionReport) {
            endReason = 'abortion';
            endDate = moment(
              getField(abortionReport, 'pregnancy_ended.abortion_date')
            );
          } else {
            endReason = 'miscarriage';
            endDate = moment(
              getField(miscarriageReport, 'pregnancy_ended.miscarriage_date')
            );
          }

          weeksPregnantAtEnd = endDate.diff(lmpDate, 'weeks');
          fields.push(
            {
              label: 'contact.profile.pregnancy.end_early',
              value: endReason,
              translate: true,
              width: 6,
            },
            {
              label: 'contact.profile.pregnancy.end_date',
              value: endDate.valueOf(),
              filter: 'simpleDate',
              width: 6,
            },
            {
              label: 'contact.profile.pregnancy.end_weeks',
              value:
                weeksPregnantAtEnd > 0
                  ? weeksPregnantAtEnd
                  : 'contact.profile.value.unknown',
              translate: weeksPregnantAtEnd <= 0,
              width: 6,
            }
          );
        }
        //if no delivery form and past 42 weeks, display EDD as delivery date
        else if (
          lmpDate &&
          today.isSameOrAfter(lmpDate.clone().add(42, 'weeks')) &&
          getSubsequentDeliveries(allReports, report, MAX_DAYS_IN_PREGNANCY)
            .length === 0
        ) {
          dateOfDelivery = getMostRecentEDDForPregnancy(allReports, report);
          fields.push({
            label: 'contact.profile.delivery_date',
            value: dateOfDelivery
              ? dateOfDelivery.valueOf()
              : 'contact.profile.value.unknown',
            filter: 'simpleDate',
            translate: dateOfDelivery ? false : true,
            width: 6,
          });
        }
      }

      if (babiesDeceased > 0) {
        if (getField(report, 'baby_death')) {
          fields.push({
            label: 'contact.profile.deceased_babies',
            value: babiesDeceased,
            width: 6,
          });
          let babyDeaths = getField(report, 'baby_death.baby_death_repeat');
          if (!babyDeaths) {
            babyDeaths = [];
          }
          let count = 0;
          babyDeaths.forEach(function (babyDeath) {
            if (count > 0) {
              fields.push({ label: '', value: '', width: 6 });
            }
            fields.push(
              {
                label: 'contact.profile.newborn.death_date',
                value: babyDeath.baby_death_date,
                filter: 'simpleDate',
                width: 6,
              },
              {
                label: 'contact.profile.newborn.death_place',
                value: babyDeath.baby_death_place,
                translate: true,
                width: 6,
              },
              {
                label: 'contact.profile.delivery.stillbirthQ',
                value: babyDeath.stillbirth,
                translate: true,
                width: 6,
              }
            );
            count++;
            if (count === babyDeaths.length) {
              fields.push({ label: '', value: '', width: 6 });
            }
          });
        }
      }

      if (relevantPregnancy) {
        ancFacilityVisits = countANCFacilityVisits(
          allReports,
          relevantPregnancy
        );
        fields.push({
          label: 'contact.profile.anc_visit',
          value: ancFacilityVisits,
          width: 3,
        });

        const highRisk = isHighRiskPregnancy(allReports, relevantPregnancy);
        if (highRisk) {
          let riskValue = '';
          const riskFactors = getAllRiskFactors(allReports, relevantPregnancy);
          const riskFactorsCustom = getAllRiskFactorExtra(
            allReports,
            relevantPregnancy
          );
          if (!riskFactors && riskFactorsCustom) {
            riskValue = riskFactorsCustom.join(', ');
          } else if (
            riskFactors.length > 1 ||
            (riskFactors && riskFactorsCustom)
          ) {
            riskValue = 'contact.profile.risk.multiple';
          } else {
            riskValue = 'contact.profile.danger_sign.' + riskFactors[0];
          }
          fields.push({
            label: 'contact.profile.risk.high',
            value: riskValue,
            translate: true,
            icon: 'icon-risk',
            width: 6,
          });
        }
      }

      return fields;
    },
  },
  {
    label: 'contact.profile.treatment_program',
    appliesToType: 'person',
    appliesIf: function () {
      const treatment_reports = getMostRecentEnrollment(contact, allReports, [
        'art',
        'tb',
        'ncd',
        'malnutrition',
        'eid',
      ]);
      return treatment_reports.enrollment && !treatment_reports.exit;
    },
    fields: function () {
      const fields = [];
      const artProgramId = getTreatmentProgramId(contact, allReports, ['art']);
      fields.push({
        label: 'contact.profile.art',
        // eslint-disable-next-line no-nested-ternary
        value: getMostRecentEnrollment(contact, allReports, ['art']).enrollment
          ? artProgramId
            ? artProgramId.toUpperCase()
            : 'contact.profile.no-id'
          : 'contact.profile.not-enrolled',
        width: 6,
        translate: true,
      });
      if (getYearsPast(new Date(contact.date_of_birth), new Date(now)) < 5) {
        fields.push({
          label: 'contact.profile.eid',
          value: getMostRecentEnrollment(contact, allReports, ['eid'])
            .enrollment
            ? getTreatmentProgramId(contact, allReports, ['eid']).toUpperCase()
            : 'contact.profile.not-enrolled',
          width: 6,
          translate: true,
        });
      }
      fields.push({
        label: 'contact.profile.tb_program',
        value: getMostRecentEnrollment(contact, allReports, ['tb']).enrollment
          ? 'contact.profile.enrolled'
          : 'contact.profile.not-enrolled',
        width: 12,
        translate: true,
      });
      if (getYearsPast(new Date(contact.date_of_birth), new Date(now)) < 5) {
        fields.push({
          label: 'contact.profile.malnutrition_program',
          value: getMostRecentEnrollment(contact, allReports, ['malnutrition'])
            .enrollment
            ? 'contact.profile.enrolled'
            : 'contact.profile.not-enrolled',
          width: 12,
          translate: true,
        });
      }
      fields.push({
        label: 'contact.profile.ncd_label',
        value: getMostRecentEnrollment(contact, allReports, ['ncd']).enrollment
          ? Array.from(new Set(getNcds(contact, allReports, ['ncd']))).join()
          : 'contact.profile.not-enrolled',
        width: 12,
        translate: true,
      });
      if (getMostRecentEnrollment(contact, allReports, ['ncd']).enrollment) {
        fields.push({
          label: 'contact.profile.ncd_id',
          value: getTreatmentProgramId(contact, allReports, ['ncd'])
            ? getTreatmentProgramId(contact, allReports, ['ncd']).toUpperCase()
            : 'contact.profile.no-id',
          width: 6,
          translate: true,
        });
      }
      fields.push({
        label: 'contact.profile.mental_health_id',
        value: getMostRecentEnrollment(contact, allReports, ['mental_health'])
          .enrollment
          ? getTreatmentProgramId(contact, allReports, [
              'mental_health',
            ]).toUpperCase()
          : 'contact.profile.not-enrolled',
        width: 6,
        translate: true,
      });
      return fields;
    },
    modifyContext: function (ctx) {
      ctx.is_in_art = getMostRecentEnrollment(contact, allReports, ['art'])
        .enrollment
        ? 'yes'
        : 'no';
      ctx.is_in_tb = getMostRecentEnrollment(contact, allReports, ['tb'])
        .enrollment
        ? 'yes'
        : 'no';
      ctx.is_in_ncd = getMostRecentEnrollment(contact, allReports, ['ncd'])
        .enrollment
        ? 'yes'
        : 'no';
      ctx.is_in_eid = getMostRecentEnrollment(contact, allReports, ['eid'])
        .enrollment
        ? 'yes'
        : 'no';
      ctx.is_in_malnutrition = getMostRecentEnrollment(contact, allReports, [
        'malnutrition',
      ]).enrollment
        ? 'yes'
        : 'no';
      ctx.ncds = getNcds(contact, allReports, ['ncd']);
      ctx.other_ncds = Array.from(
        new Set(getNcds(contact, allReports, ['ncd']))
      )
        .join()
        .split(' - ')[1];
      ctx.art_duration = getTreatmentDuration(contact, allReports, ['art']);
      ctx.tb_treatment_duration = getTreatmentDuration(contact, allReports, [
        'tb',
      ]);
      ctx.appt_date = getAppointmentDateFromLastTraceReport(allReports);
      ctx.trace_reasons = getTraceReasonsFromLastTraceReport(allReports);
      ctx.has_trace_report = getSubsequentTraceReports(allReports).length
        ? 'yes'
        : 'no';
      ctx.art_duration_years = parseInt(
        getTreatmentDuration(contact, allReports, ['art']) / DAYS_IN_YEAR
      );
      ctx.is_contact_tracing_referred = isContactTraceReferred(allReports)
        ? 'yes'
        : 'no';
      ctx.ncd_id = getTreatmentProgramId(contact, allReports, ['ncd']);
      ctx.tb_test_result = getTBTestResult(allReports);
    },
  },
];

module.exports = {
  context: context,
  cards: cards,
  fields: fields,
};
