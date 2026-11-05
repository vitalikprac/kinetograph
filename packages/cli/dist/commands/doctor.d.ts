import { type DoctorReport } from '@kinetographdev/compat/doctor';
import type { UnsupportedImport } from '../bundle.js';
import { type Command } from './types.js';
/** The report as people read it. */
export declare function formatReport(report: DoctorReport): string;
/** The imports of packages Kinetograph does not support, one line each, with the file that imports them. */
export declare function formatImports(imports: readonly UnsupportedImport[]): string;
export declare const doctor: Command;
//# sourceMappingURL=doctor.d.ts.map