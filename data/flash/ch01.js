/**
 * Flashcards Anatomie — chapitre 01 (Introduction)
 * ~30 cartes (volume idéal). kind: "text" | "schema"
 */
(function (w) {
  w.PASS_FLASH = w.PASS_FLASH || {};
  w.PASS_FLASH_REGISTRY = w.PASS_FLASH_REGISTRY || [];

  w.PASS_FLASH["01"] = [
    { id: "FC-ANAT-01-001", chapter: "01", priority: "P3", kind: "text", front: "Anatomie = science morphologique : 3 piliers ?", back: "Observation, dissection (réelle ou virtuelle), imagerie." },
    { id: "FC-ANAT-01-002", chapter: "01", priority: "P3", kind: "text", front: "Nomina Anatomica : lieu et année ?", back: "Bâle (Suisse), 1895." },
    { id: "FC-ANAT-01-003", chapter: "01", priority: "P3", kind: "text", front: "Terminologia anatomica : année ?", back: "1998 — langage anatomique international commun." },
    { id: "FC-ANAT-01-004", chapter: "01", priority: "P3", kind: "text", front: "Omoplate → terme actuel ?", back: "Scapula." },
    { id: "FC-ANAT-01-005", chapter: "01", priority: "P3", kind: "text", front: "Axe médian : 3 repères + centre de gravité ?", back: "Vertex, C7 (= centre de gravité), sillon fessier. Axe longitudinal." },

    { id: "FC-ANAT-01-006", chapter: "01", priority: "P1", kind: "text", front: "Position anatomique : attitude du sujet ?", back: "Sujet debout." },
    { id: "FC-ANAT-01-007", chapter: "01", priority: "P1", kind: "text", front: "Position anatomique : bras ?", back: "Bras pendants le long du corps." },
    { id: "FC-ANAT-01-008", chapter: "01", priority: "P1", kind: "text", front: "Avant-bras et mains en position anatomique ?", back: "En supination." },
    { id: "FC-ANAT-01-009", chapter: "01", priority: "P1", kind: "text", front: "Supination : paumes et pouces ?", back: "Paumes vers l'avant ; pouces latéraux ; autres doigts vers le bas." },
    { id: "FC-ANAT-01-010", chapter: "01", priority: "P1", kind: "text", front: "Les 3 plans de référence : relation entre eux ?", back: "Perpendiculaires entre eux." },
    { id: "FC-ANAT-01-011", chapter: "01", priority: "P1", kind: "text", front: "Plan frontal / coronal ?", back: "Vertical ; // au front / face ventrale ; se déplace d'avant en arrière." },
    { id: "FC-ANAT-01-012", chapter: "01", priority: "P1", kind: "text", front: "Plan sagittal : que sépare-t-il ?", back: "Deux moitiés droite et gauche (vertical ; médial → latéral)." },
    { id: "FC-ANAT-01-013", chapter: "01", priority: "P1", kind: "text", front: "Plan sagittal médian : moitiés ?", back: "Centre du corps ; 2 moitiés égales mais non symétriques." },
    { id: "FC-ANAT-01-014", chapter: "01", priority: "P1", kind: "text", front: "Plans sagittaux paramédians ?", back: "Ils s'éloignent de l'axe médian (ne passent pas par le centre)." },
    { id: "FC-ANAT-01-015", chapter: "01", priority: "P1", kind: "text", front: "Plan axial / transversal ?", back: "Horizontal ; ⊥ à l'axe vertical ; crânial → caudal ; le plus utilisé en imagerie." },

    { id: "FC-ANAT-01-016", chapter: "01", priority: "P2", kind: "text", front: "Antérieur/ventral vs postérieur/dorsal ?", back: "Antérieur/ventral = en avant. Postérieur/dorsal = en arrière." },
    { id: "FC-ANAT-01-017", chapter: "01", priority: "P2", kind: "text", front: "Crânial/supérieur vs caudal/inférieur ?", back: "Crânial = en haut. Caudal = en bas." },
    { id: "FC-ANAT-01-018", chapter: "01", priority: "P2", kind: "text", front: "Proximal vs distal : référentiel ?", back: "Par rapport à l'origine du membre." },
    { id: "FC-ANAT-01-019", chapter: "01", priority: "P2", kind: "text", front: "Médial/interne vs latéral/externe : référentiel ?", back: "Par rapport au plan médian." },
    { id: "FC-ANAT-01-020", chapter: "01", priority: "P2", kind: "text", front: "Ne pas confondre proximal/distal et médial/latéral ?", back: "Proximal/distal → membre. Médial/latéral → plan médian." },
    { id: "FC-ANAT-01-021", chapter: "01", priority: "P2", kind: "text", front: "Homolatéral / ipsilatéral vs controlatéral ?", back: "Même côté vs côté opposé." },
    { id: "FC-ANAT-01-022", chapter: "01", priority: "P2", kind: "text", front: "Histologie = quelle subdivision ?", back: "Anatomie microscopique." },
    { id: "FC-ANAT-01-023", chapter: "01", priority: "P2", kind: "text", front: "Anatomie générale « par appareil » ?", back: "Regroupement par fonction (locomoteur, cardio-circulatoire…)." },
    { id: "FC-ANAT-01-024", chapter: "01", priority: "P2", kind: "text", front: "Définition d'un appareil ?", back: "Groupement de systèmes à une même fonction, éventuellement dans des régions différentes." },
    { id: "FC-ANAT-01-025", chapter: "01", priority: "P2", kind: "text", front: "Morphologie externe vs interne ?", back: "Externe = vues sous plusieurs angles. Interne = coupes dans l'organe." },
    { id: "FC-ANAT-01-026", chapter: "01", priority: "P2", kind: "text", front: "Y a-t-il une cavité dans les membres ?", back: "Non." },
    { id: "FC-ANAT-01-027", chapter: "01", priority: "P2", kind: "text", front: "Coupes axiales : vue par défaut ?", back: "Vues du dessous (sauf indication contraire)." },
    { id: "FC-ANAT-01-028", chapter: "01", priority: "P2", kind: "text", front: "Coupe axiale du tronc : avant / arrière sur l'image ?", back: "Avant (ventral) en haut ; arrière (dorsal) en bas." },
    { id: "FC-ANAT-01-029", chapter: "01", priority: "P2", kind: "text", front: "Coupe axiale : droite / gauche du patient ?", back: "Inversées (droite du patient à gauche de l'image)." },
    { id: "FC-ANAT-01-030", chapter: "01", priority: "P2", kind: "text", front: "Anatomie topographique : objet ?", back: "Disposition et rapports des organes au niveau des régions." }
  ];

  if (!w.PASS_FLASH_REGISTRY.includes("01")) w.PASS_FLASH_REGISTRY.push("01");
})(window);
