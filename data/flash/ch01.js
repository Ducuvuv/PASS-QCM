/**
 * Flashcards Anatomie — chapitre 01 (Introduction)
 * kind: "text" | "schema" (schémas = plus tard)
 * priority: "P1" | "P2" | "P3"
 */
(function (w) {
  w.PASS_FLASH = w.PASS_FLASH || {};
  w.PASS_FLASH_REGISTRY = w.PASS_FLASH_REGISTRY || [];

  w.PASS_FLASH["01"] = [
    { id: "FC-ANAT-01-001", chapter: "01", priority: "P1", kind: "text", front: "Position anatomique : attitude du sujet ?", back: "Sujet debout." },
    { id: "FC-ANAT-01-002", chapter: "01", priority: "P1", kind: "text", front: "Position anatomique : bras ?", back: "Bras pendants le long du corps." },
    { id: "FC-ANAT-01-003", chapter: "01", priority: "P1", kind: "text", front: "Position anatomique : avant-bras / mains / paumes / pouces ?", back: "Supination ; paumes vers l'avant ; pouces latéraux ; autres doigts vers le bas." },
    { id: "FC-ANAT-01-004", chapter: "01", priority: "P1", kind: "text", front: "Plan frontal (coronal) : orientation ?", back: "Vertical ; parallèle au front / face ventrale ; se déplace d'avant en arrière." },
    { id: "FC-ANAT-01-005", chapter: "01", priority: "P1", kind: "text", front: "Plan sagittal médian : moitiés ?", back: "Passe par le centre ; 2 moitiés égales mais non symétriques." },
    { id: "FC-ANAT-01-006", chapter: "01", priority: "P1", kind: "text", front: "Plan axial : orientation + usage imagerie ?", back: "Horizontal, ⊥ à l'axe vertical ; plan le plus utilisé en imagerie." },
    { id: "FC-ANAT-01-007", chapter: "01", priority: "P2", kind: "text", front: "Proximal/distal vs médial/latéral ?", back: "Proximal/distal → origine du membre. Médial/latéral → plan médian." },
    { id: "FC-ANAT-01-008", chapter: "01", priority: "P2", kind: "text", front: "Coupes axiales : vue par défaut + piège D/G ?", back: "Vues du dessous ; droite et gauche inversées sur l'image." },
    { id: "FC-ANAT-01-009", chapter: "01", priority: "P2", kind: "text", front: "Définition d'un appareil ?", back: "Groupement de systèmes à une même fonction, éventuellement dans des régions différentes." },
    { id: "FC-ANAT-01-010", chapter: "01", priority: "P3", kind: "text", front: "Nomenclature : Nomina Anatomica → Terminologia ?", back: "Nomina Anatomica : Bâle 1895 → Terminologia anatomica : 1998 (ex. omoplate → scapula)." }
  ];

  if (!w.PASS_FLASH_REGISTRY.includes("01")) w.PASS_FLASH_REGISTRY.push("01");
})(window);
