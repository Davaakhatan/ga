// config.js

// Configuration for different curriculum types and their document structure
export const curriculumConfig = {
    computerScience: {
      curriculumType: "Computer Science",
      header: "Computer Science Curriculum",
      footer: "Total Credits: 129",
      offsetText:
        "Computer Science Curriculum\n(Numerals in front of courses indicate credits)\n",
    },
    cybersecurity: {
      curriculumType: "Cybersecurity",
      header: "Cybersecurity Curriculum",
      footer: "Total Credits: 126",
      offsetText:
        "Cybersecurity Curriculum\n(Numerals in front of courses indicate credits)\n",
    },
    softwareEngineering: {
      curriculumType: "Software Engineering",
      header: "Software Engineering Curriculum",
      footer: "Total Credits: 129",
      offsetText:
        "Software Engineering Curriculum\n(Numerals in front of courses indicate credits)\n",
    },
  };
  
  // Mapping for course filtering based on program, year, and semester
  export const courseRegexMapping = {
    "computer-science": {
      freshman: {
        fall: /^(CIS_180|CIS_181|CIS_290|MATH_140)/i,
        spring: /^(CIS_182|CIS_183|MATH_141|PHYS_210(_\d+)?|PHYS_211(_\d+)?)/i,
      },
      sophomore: {
        fall: /^(CSC_220|CIS_239|CIS_277|CIS_287|MATH_222)/i,
        spring: /^(CIS_255|CSC_223|SOFT_210|MATH_223|MATH_314|PHYS_214(_\d+)?|PHYS_212(_\d+)?|PHYS_213(_\d+)?|PHYS_215(_\d+)?)/i,
      },
      junior: {
        fall: /^(CIS_355|CIS_326|CIS_219|MATH_213|MATH_212)/i,
        spring: /^(MATH_310)/i,
      },
      senior: {
        fall: /^(CIS_457|CSC_360|CIS_387|CSC_330)/i,
        spring: /^(CIS_458|CIS_390)/i,
      },
      graduate: {
        fall: /^$/,
        spring: /^$/,
      },
    },
    cybersecurity: {
      freshman: {
        fall: /^(CIS_180|CIS_181|CIS_290|CIS_240|MATH_112|MATH_140)/i,
        spring: /^(CIS_182|CIS_183|CIS_255|PHYS_105|CYSEC_101)/i,
      },
      sophomore: {
        fall: /^(MATH_222|CSC_220|CIS_355|CYSEC_210)/i,
        spring: /^(CIS_182|CIS_183|CIS_255|PHYS_105|CYSEC_101)/i,
      },
      junior: {
        fall: /^(CYSEC_301|CYSEC_306|CRJS_241|MATH_213)/i,
        spring: /^(MATH_310|CYSEC_302|CYSEC_307)/i,
      },
      senior: {
        fall: /^(CYSEC_308|CIS_457|CRJS_345)/i,
        spring: /^(CYSEC_303|CIS_458)/i,
      },
      graduate: {
        fall: /^$/,
        spring: /^$/,
      },
    },
    "software-engineering": {
      freshman: {
        fall: /^(CIS_180|CIS_181|MATH_140|CIS_290)/i,
        spring: /^(CIS_182|CIS_183|MATH_141)/i,
      },
      sophomore: {
        fall: /^(CSC_220|CIS_239|MATH_213|MATH_312|CIS_277|CIS_287)/i,
        spring: /^(CIS_255|CSC_223|MATH_223|CIS_377|MATH_314)/i,
      },
      junior: {
        fall: /^(CIS_326|CIS_350|CIS_219|SOFT_310)/i,
        spring: /^(SOFT_320|ECE_337|ENG_380)/i,
      },
      senior: {
        fall: /^(CIS_457|CSC_330|SOFT_410|CIS_387)/i,
        spring: /^(CIS_458|CIS_390|MATH_310)/i,
      },
      graduate: {
        fall: /^$/,
        spring: /^$/,
      },
    },
    "software-engineering-dual-degree": {
      freshman: {
        fall: /^(CIS_180|CIS_181|MATH_140|CIS_290)/i,
        spring: /^(CIS_182|CIS_183|MATH_141|PHYS_210(_\d+)?|PHYS_211(_\d+)?)/i,
      },
      sophomore: {
        fall: /^(CSC_220|CIS_239|MATH_222|CIS_277|CIS_287)/i,
        spring: /^(CIS_255|CSC_223|MATH_223|CIS_377|MATH_314|SOFT_210|MATH_213|MATH_312|CIS_377)/i,
      },
      junior: {
        fall: /^(CIS_355|CIS_350|CIS_219|SOFT_310)/i,
        spring: /^(SOFT_320|ECE_337|ENG_380|PHYS_212(_\d+)?|PHYS_213(_\d+)?|PHYS_215(_\d+)?)/i,
      },
      senior: {
        fall: /^(CIS_457|CSC_330|SOFT_410|CSC_360|CIS_326|CIS_387)/i,
        spring: /^(CIS_458|CIS_390|MATH_310)/i,
      },
      graduate: {
        fall: /^$/,
        spring: /^$/,
      },
    },
  };
  