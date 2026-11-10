import type { ChecklistItem } from "./types"
export function matchesDivision(item: ChecklistItem, division?: string) {
 const classDiv = (division || "").trim().toLowerCase()
      const cat = (item.category || "").trim().toLowerCase()
      // If item is assigned to "all", "general", legacy categories, or empty, it applies to all classrooms
      if (
        !cat ||
        cat === "all" ||
        cat === "all divisions" ||
        cat === "general" ||
        ["energy", "waste", "cleanliness", "environment"].includes(cat)
      ) {
        return true
      }
      if (!classDiv) return true
      if (cat === classDiv) return true
      if (cat.includes("pre") && classDiv.includes("pre")) return true
      if (cat.includes("elem") && classDiv.includes("elem")) return true
      if ((cat.includes("middle") || cat.includes("interm")) && (classDiv.includes("middle") || classDiv.includes("interm"))) return true
      if ((cat.includes("high") || cat.includes("second")) && (classDiv.includes("high") || classDiv.includes("second"))) return true
      if (cat.includes("tech") && classDiv.includes("tech")) return true
      return false
}
