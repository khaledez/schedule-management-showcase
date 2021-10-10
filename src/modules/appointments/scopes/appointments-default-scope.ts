export const AppointmentsDefaultScope = () => ({
  // where: {
  //   deletedAt: null,
  //   deletedBy: null,
  // },
  attributes: { exclude: ['deletedAt', 'deletedBy'] },
  individualHooks: true,
});
