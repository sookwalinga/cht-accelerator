
module.exports = [
  // Create a Task when a new contact is created
  {
    name: 'padr-after-registration',
    icon: 'icon-healthcare',
    title: 'Patient Consultation',
    appliesTo: 'contacts',
    appliesToType: ['person'],
    actions: [{ form: 'padr' }],
    events: [
      {
        id: 'padr-form',
        days: 7,
        start: 7,
        end: 0,
      }
    ]
  },

  // Create a Task when a report is submitted with ongoing reaction
  {
    name: 'serious-case',
    icon: 'icon-pqhpt',
    title: 'Ongoing Adverse Reaction',
    appliesTo: 'reports',
    appliesToType: ['padr'],
    actions: [{ form: 'follow' }],
    events: [
      {
        id: 'alarm-on-ongoing-reaction',
        days: 7,
        start: 7,
        end: 0,
      }
    ],
    priority: {
      level: 'high',
    },
    appliesIf: function (contact, report) {
      return Utils.getField(report, 'reaction.group_reaction.on') === 'yes';
    },
    resolvedIf: function (contact, report, event, dueDate) {
      return Utils.isFormSubmittedInWindow(
        contact.reports,
        'follow',
        Utils.addDate(dueDate, -event.start).getTime(),
        Utils.addDate(dueDate, event.end + 1).getTime()
      );
    }
  }

];