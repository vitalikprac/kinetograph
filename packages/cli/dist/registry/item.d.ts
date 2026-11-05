import { z } from 'zod';
export declare const ITEM_TYPES: readonly ["component", "template", "taste"];
export type ItemType = (typeof ITEM_TYPES)[number];
/** The folder under `src/` each type installs into. */
export declare const TYPE_FOLDERS: Record<ItemType, string>;
/** The `public/` folders `kinetograph init` makes; an item's assets go in these, namespaced by item name. */
export declare const ASSET_KINDS: readonly ["images", "fonts", "audio", "video"];
/** Where a registry item may write: nothing outside these top-level folders of the project. */
export declare const TARGET_ROOTS: readonly ["src", "public"];
export declare const MAX_FILES = 200;
export declare const isItemName: (name: string) => boolean;
/**
 * Why `path` is not a safe relative path, or undefined when it is: absolute paths, `..` and `.` segments, empty
 * segments, backslashes and control characters are all refused, so a path cannot name anything outside its folder.
 */
export declare function pathProblem(path: string): string | undefined;
/** Why a file `target` is refused, or undefined: a safe relative path under `src/` or `public/`, not those folders themselves. */
export declare function targetProblem(target: string): string | undefined;
export declare const registryItemSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    type: z.ZodEnum<{
        template: "template";
        component: "component";
        taste: "taste";
    }>;
    title: z.ZodString;
    description: z.ZodString;
    kinetograph: z.ZodString;
    dependencies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    registryDependencies: z.ZodOptional<z.ZodArray<z.ZodString>>;
    files: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        path: z.ZodString;
        target: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        path: z.ZodString;
        target: z.ZodString;
        url: z.ZodString;
        sha256: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>]>>;
    props: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        optional: z.ZodOptional<z.ZodBoolean>;
        doc: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    access: z.ZodOptional<z.ZodEnum<{
        free: "free";
        paid: "paid";
    }>>;
}, z.core.$strip>;
export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryFile = RegistryItem['files'][number];
export declare const registryIndexSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<{
            template: "template";
            component: "component";
            taste: "taste";
        }>;
        title: z.ZodString;
        description: z.ZodString;
        access: z.ZodOptional<z.ZodEnum<{
            free: "free";
            paid: "paid";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type RegistryIndex = z.infer<typeof registryIndexSchema>;
/** The JSON Schema file for items (docs/registry-item.schema.json, served at `<registry>/schema.json`). */
export declare function itemJsonSchema(): object;
/** The first problem with an item that the schema cannot say: unsafe paths, repeated targets. Undefined when it is fine. */
export declare function itemProblem(item: RegistryItem): string | undefined;
//# sourceMappingURL=item.d.ts.map