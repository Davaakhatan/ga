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
  // Utility function to generate a regex from course prefixes
const generateRegex = (coursePrefixes) => {
  return new RegExp(coursePrefixes.map(prefix => `^${prefix}`).join("|"), "i");
};

export const courseRegexMapping = {
  "computer-science": {
    freshman: {
      fall: generateRegex(["ENG_102","CIS_180", "CIS_181", "CIS_290", "MATH_140"]),
      spring: generateRegex(["CIS_182", "CIS_183", "MATH_141", "PHYS_210", "PHYS_211"]),
    },
    sophomore: {
      fall: generateRegex(["CSC_220", "CIS_239", "CIS_277", "CIS_287", "MATH_222"]),
      spring: generateRegex(["CIS_255", "CSC_223", "SOFT_210", "MATH_223", "MATH_314", "PHYS_214", "PHYS_212", "PHYS_213", "PHYS_215"]),
    },
    junior: {
      fall: generateRegex(["CIS_355", "CIS_326", "CIS_219", "MATH_213", "MATH_212"]),
      spring: generateRegex(["MATH_310"]),
    },
    senior: {
      fall: generateRegex(["CIS_457", "CSC_360", "CIS_387", "CSC_330"]),
      spring: generateRegex(["CIS_458", "CIS_390"]),
    },
    graduate: {
      fall: generateRegex([]),
      spring: generateRegex([]),
    },
  },

  cybersecurity: {
    freshman: {
      fall: generateRegex(["CIS_180", "CIS_181", "CIS_290", "CIS_240", "MATH_112", "MATH_140"]),
      spring: generateRegex(["CIS_182", "CIS_183", "CIS_255", "PHYS_105", "CYSEC_101"]),
    },
    sophomore: {
      fall: generateRegex(["MATH_222", "CSC_220", "CIS_355", "CYSEC_210"]),
      spring: generateRegex(["CIS_182", "CIS_183", "CIS_255", "PHYS_105", "CYSEC_101"]),
    },
    junior: {
      fall: generateRegex(["CYSEC_301", "CYSEC_306", "CRJS_241", "MATH_213"]),
      spring: generateRegex(["MATH_310", "CYSEC_302", "CYSEC_307"]),
    },
    senior: {
      fall: generateRegex(["CYSEC_308", "CIS_457", "CRJS_345"]),
      spring: generateRegex(["CYSEC_303", "CIS_458"]),
    },
    graduate: {
      fall: generateRegex([]),
      spring: generateRegex([]),
    },
  },

  "software-engineering": {
    freshman: {
      fall: generateRegex(["CIS_180", "CIS_181", "MATH_140", "CIS_290"]),
      spring: generateRegex(["CIS_182", "CIS_183", "MATH_141"]),
    },
    sophomore: {
      fall: generateRegex(["CSC_220", "CIS_239", "MATH_213", "MATH_312", "CIS_277", "CIS_287"]),
      spring: generateRegex(["CIS_255", "CSC_223", "MATH_223", "CIS_377", "MATH_314"]),
    },
    junior: {
      fall: generateRegex(["CIS_326", "CIS_350", "CIS_219", "SOFT_310"]),
      spring: generateRegex(["SOFT_320", "ECE_337", "ENG_380"]),
    },
    senior: {
      fall: generateRegex(["CIS_457", "CSC_330", "SOFT_410", "CIS_387"]),
      spring: generateRegex(["CIS_458", "CIS_390", "MATH_310"]),
    },
    graduate: {
      fall: generateRegex([]),
      spring: generateRegex([]),
    },
  },

  "software-engineering-dual-degree": {
    freshman: {
      fall: generateRegex(["CIS_180", "CIS_181", "MATH_140", "CIS_290"]),
      spring: generateRegex(["CIS_182", "CIS_183", "MATH_141", "PHYS_210", "PHYS_211"]),
    },
    sophomore: {
      fall: generateRegex(["CSC_220", "CIS_239", "MATH_222", "CIS_277", "CIS_287"]),
      spring: generateRegex(["CIS_255", "CSC_223", "MATH_223", "CIS_377", "MATH_314", "SOFT_210", "MATH_213", "MATH_312"]),
    },
    junior: {
      fall: generateRegex(["CIS_355", "CIS_350", "CIS_219", "SOFT_310"]),
      spring: generateRegex(["SOFT_320", "ECE_337", "ENG_380", "PHYS_212", "PHYS_213", "PHYS_215"]),
    },
    senior: {
      fall: generateRegex(["CIS_457", "CSC_330", "SOFT_410", "CSC_360", "CIS_326", "CIS_387"]),
      spring: generateRegex(["CIS_458", "CIS_390", "MATH_310"]),
    },
    graduate: {
      fall: generateRegex([]),
      spring: generateRegex([]),
    },
  },
};
