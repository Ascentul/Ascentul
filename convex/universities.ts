export {
  createUniversity,
  getAllUniversities,
  updateUniversity,
  toggleTestUniversity,
  archiveUniversity,
  restoreUniversity,
  hardDeleteUniversity,
  deleteUniversity,
} from "./universities_admin";

export {
  assignUniversityToUser,
  updateUniversitySettings,
} from "./universities_assignments";

export {
  getUniversitySettings,
  getUniversity,
  getUniversityBySlug,
  getUniversityAdminCounts,
} from "./universities_queries";
