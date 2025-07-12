/**
 * Demographic Matching Calculator for Europe
 * Estimates population matches based on physical and social characteristics
 */

// Europe population data and demographic distributions
const EUROPE_POPULATION = 746419440; // Approximate population of Europe
const ADULT_POPULATION_RATIO = 0.82; // Adults 18+ as percentage of total population

// Demographic distribution data (based on German statistics)
const DEMOGRAPHIC_DATA = {
    gender: {
        male: 0.482,
        female: 0.517,
        diverse: 0.001,
    },
    age: {
        // Distribution for adults 18-100
        getDistribution: (minAge, maxAge) => {
            // Simplified age distribution calculation
            const totalAdultYears = 82; // 18-100
            const selectedYears = Math.max(0, maxAge - minAge + 1);
            return Math.min(1, selectedYears / totalAdultYears);
        },
    },
    height: {
        // Height distribution based on German averages with gender correlation
        getDistribution: (minHeight, maxHeight, gender) => {
            // Height ranges with population distribution
            let heightBrackets;

            if (gender === "male") {
                heightBrackets = [
                    { min: 140, max: 165, percentage: 0.05 }, // Very short men
                    { min: 165, max: 175, percentage: 0.25 }, // Short-average men
                    { min: 175, max: 185, percentage: 0.45 }, // Average-tall men (peak)
                    { min: 185, max: 195, percentage: 0.2 }, // Tall men
                    { min: 195, max: 220, percentage: 0.05 }, // Very tall men
                ];
            } else if (gender === "female") {
                heightBrackets = [
                    { min: 140, max: 155, percentage: 0.08 }, // Very short women
                    { min: 155, max: 165, percentage: 0.35 }, // Short-average women
                    { min: 165, max: 175, percentage: 0.4 }, // Average-tall women (peak)
                    { min: 175, max: 185, percentage: 0.15 }, // Tall women
                    { min: 185, max: 220, percentage: 0.02 }, // Very tall women
                ];
            } else {
                // Mixed gender distribution
                heightBrackets = [
                    { min: 140, max: 160, percentage: 0.1 },
                    { min: 160, max: 170, percentage: 0.3 },
                    { min: 170, max: 180, percentage: 0.35 },
                    { min: 180, max: 190, percentage: 0.2 },
                    { min: 190, max: 220, percentage: 0.05 },
                ];
            }

            let totalProbability = 0;

            // Calculate overlap with each height bracket
            for (const bracket of heightBrackets) {
                const overlapMin = Math.max(minHeight, bracket.min);
                const overlapMax = Math.min(maxHeight, bracket.max);

                if (overlapMin < overlapMax) {
                    const bracketSize = bracket.max - bracket.min;
                    const overlapSize = overlapMax - overlapMin;
                    const overlapRatio = overlapSize / bracketSize;

                    totalProbability += bracket.percentage * overlapRatio;
                }
            }

            return Math.min(1.0, totalProbability);
        },
    },
    weight: {
        // Weight distribution with realistic brackets
        getDistribution: (minWeight, maxWeight) => {
            const weightBrackets = [
                { min: 40, max: 55, percentage: 0.1 }, // Underweight
                { min: 55, max: 70, percentage: 0.3 }, // Normal-light
                { min: 70, max: 85, percentage: 0.35 }, // Normal-average (peak)
                { min: 85, max: 100, percentage: 0.2 }, // Above average
                { min: 100, max: 120, percentage: 0.04 }, // Heavy
                { min: 120, max: 150, percentage: 0.01 }, // Very heavy
            ];

            let totalProbability = 0;

            // Calculate overlap with each weight bracket
            for (const bracket of weightBrackets) {
                const overlapMin = Math.max(minWeight, bracket.min);
                const overlapMax = Math.min(maxWeight, bracket.max);

                if (overlapMin < overlapMax) {
                    const bracketSize = bracket.max - bracket.min;
                    const overlapSize = overlapMax - overlapMin;
                    const overlapRatio = overlapSize / bracketSize;

                    totalProbability += bracket.percentage * overlapRatio;
                }
            }

            return Math.min(1.0, totalProbability);
        },
    },
    hairColor: {
        blond: 0.25,
        brown: 0.45,
        black: 0.2,
        red: 0.04,
        gray: 0.06,
    },
    eyeColor: {
        blue: 0.4,
        brown: 0.35,
        green: 0.15,
        gray: 0.1,
    },
    income: {
        // Monthly income distribution with realistic curve
        getDistribution: (minIncome, maxIncome) => {
            // Income brackets with their population percentages
            const incomeBrackets = [
                { min: 0, max: 1500, percentage: 0.15 }, // Low income
                { min: 1500, max: 2500, percentage: 0.25 }, // Below average
                { min: 2500, max: 4000, percentage: 0.35 }, // Average range
                { min: 4000, max: 6000, percentage: 0.2 }, // Above average
                { min: 6000, max: 10000, percentage: 0.08 }, // High income
                { min: 10000, max: 20000, percentage: 0.02 }, // Very high income
            ];

            let totalProbability = 0;

            // Calculate overlap with each income bracket
            for (const bracket of incomeBrackets) {
                const overlapMin = Math.max(minIncome, bracket.min);
                const overlapMax = Math.min(maxIncome, bracket.max);

                if (overlapMin < overlapMax) {
                    // Calculate what portion of this bracket is covered
                    const bracketSize = bracket.max - bracket.min;
                    const overlapSize = overlapMax - overlapMin;
                    const overlapRatio = overlapSize / bracketSize;

                    // Add the proportional probability from this bracket
                    totalProbability += bracket.percentage * overlapRatio;
                }
            }

            return Math.min(1.0, totalProbability);
        },
    },
    attractiveness: {
        // Attractiveness follows normal distribution (bell curve)
        getDistribution: (minAttr, maxAttr) => {
            const attractivenessBrackets = [
                { min: 1, max: 2, percentage: 0.05 }, // Very low
                { min: 2, max: 4, percentage: 0.15 }, // Low
                { min: 4, max: 7, percentage: 0.6 }, // Average (peak)
                { min: 7, max: 9, percentage: 0.15 }, // High
                { min: 9, max: 10, percentage: 0.05 }, // Very high
            ];

            let totalProbability = 0;

            // Calculate overlap with each attractiveness bracket
            for (const bracket of attractivenessBrackets) {
                const overlapMin = Math.max(minAttr, bracket.min);
                const overlapMax = Math.min(maxAttr, bracket.max);

                if (overlapMin <= overlapMax) {
                    const bracketSize = bracket.max - bracket.min + 1;
                    const overlapSize = overlapMax - overlapMin + 1;
                    const overlapRatio = overlapSize / bracketSize;

                    totalProbability += bracket.percentage * overlapRatio;
                }
            }

            return Math.min(1.0, totalProbability);
        },
    },
};

// Fun comparison data
const COMPARISONS = [
    { probability: 1 / 1, text: "meeting someone in a supermarket" },
    { probability: 1 / 2, text: "flipping heads on a coin" },
    { probability: 1 / 3, text: "rolling a 1, 2 or 3 on a 6-sided die" },
    {
        probability: 1 / 5,
        text: "guessing a weekday correctly on the first try",
    },
    { probability: 1 / 10, text: "being born in October" },
    { probability: 1 / 20, text: "being left-handed (global average)" },
    { probability: 1 / 30, text: "having green eyes" },
    { probability: 1 / 50, text: "having red hair in Europe" },
    { probability: 1 / 70, text: "being over 190 cm tall (men)" },
    { probability: 1 / 100, text: "having twins in your family" },
    { probability: 1 / 500, text: "getting your luggage lost at the airport" },
    { probability: 1 / 1000, text: "finding a four-leaf clover" },
    { probability: 1 / 2000, text: "being struck by lightning (per year)" },
    { probability: 1 / 5000, text: "winning a small lottery prize" },
    {
        probability: 1 / 8000,
        text: "being ambidextrous (writing with both hands)",
    },
    { probability: 1 / 10000, text: "finding a pearl in an oyster" },
    { probability: 1 / 30000, text: "being colorblind (women)" },
    { probability: 1 / 50000, text: "being born on a leap day" },
    { probability: 1 / 88000, text: "being left-handed and red-haired" },
    { probability: 1 / 100000, text: "becoming a professional athlete" },
    {
        probability: 1 / 200000,
        text: "having heterochromia (two different eye colors)",
    },
    { probability: 1 / 500000, text: "being struck by a meteorite" },
    { probability: 1 / 1000000, text: "winning a major lottery jackpot" },
    { probability: 1 / 3000000, text: "being born with albinism" },
    { probability: 1 / 7000000, text: "being a Nobel Prize winner" },
    { probability: 1 / 10000000, text: "finding a unicorn! 🦄" },
    {
        probability: 1 / 50000000,
        text: "having the same fingerprint as someone else",
    },
    {
        probability: 1 / 7900000000,
        text: "having your exact DNA (unless you have an identical twin)",
    },
];

class DemographicCalculator {
    constructor() {
        this.initializeEventListeners();
        this.updateSliderValues();
    }

    initializeEventListeners() {
        // Form submission
        document
            .getElementById("demographic-form")
            .addEventListener("submit", (e) => {
                e.preventDefault();
                this.calculateMatches();
            });

        // Form reset
        document.getElementById("reset-btn").addEventListener("click", () => {
            this.resetForm();
        });

        // Parameter toggle checkboxes
        this.setupParameterToggles();

        // Choice button groups
        this.setupChoiceButtons();

        // Checkbox toggles for "Any" options
        this.setupCheckboxToggles();

        // Slider value updates
        this.setupSliderUpdates();

        // Range slider constraints
        this.setupRangeSliders();
    }

    setupParameterToggles() {
        const toggles = [
            "gender-toggle",
            "age-toggle",
            "height-toggle",
            "weight-toggle",
            "hair-toggle",
            "eye-toggle",
            "attractiveness-toggle",
            "income-toggle",
        ];

        toggles.forEach((toggleId) => {
            const toggle = document.getElementById(toggleId);
            const contentId = toggleId.replace("-toggle", "-content");
            const content = document.getElementById(contentId);

            if (toggle && content) {
                toggle.addEventListener("change", () => {
                    if (toggle.checked) {
                        content.classList.remove("disabled");
                    } else {
                        content.classList.add("disabled");
                    }
                });
            }
        });
    }

    setupChoiceButtons() {
        const buttonGroups = document.querySelectorAll(".button-group");

        buttonGroups.forEach((group) => {
            const buttons = group.querySelectorAll(".choice-btn");

            buttons.forEach((button) => {
                button.addEventListener("click", () => {
                    // Remove active class from all buttons in this group
                    buttons.forEach((btn) => btn.classList.remove("active"));
                    // Add active class to clicked button
                    button.classList.add("active");
                });
            });
        });
    }

    setupCheckboxToggles() {
        // No longer needed since we removed the "Any" checkboxes
        // All parameter toggling is now handled by the main parameter toggles
    }

    setupRangeSliders() {
        const rangeGroups = [
            { min: "age-min", max: "age-max" },
            { min: "height-min", max: "height-max" },
            { min: "weight-min", max: "weight-max" },
            { min: "income-min", max: "income-max" },
            { min: "attractiveness-min", max: "attractiveness-max" },
        ];

        rangeGroups.forEach((group) => {
            const minSlider = document.getElementById(group.min);
            const maxSlider = document.getElementById(group.max);

            if (minSlider && maxSlider) {
                // Ensure min slider doesn't go above max slider
                minSlider.addEventListener("input", () => {
                    if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
                        maxSlider.value = minSlider.value;
                        // Update the max value display
                        const maxValueSpan = document.getElementById(
                            group.max + "-value",
                        );
                        if (maxValueSpan) {
                            let value = maxSlider.value;
                            if (group.max.includes("income")) {
                                value = parseInt(value).toLocaleString("de-DE");
                            }
                            maxValueSpan.textContent = value;
                            this.updateValuePosition(maxSlider, maxValueSpan);
                        }
                    }
                    this.updateSliderFill(group.min);
                });

                // Ensure max slider doesn't go below min slider
                maxSlider.addEventListener("input", () => {
                    if (parseInt(maxSlider.value) < parseInt(minSlider.value)) {
                        minSlider.value = maxSlider.value;
                        // Update the min value display
                        const minValueSpan = document.getElementById(
                            group.min + "-value",
                        );
                        if (minValueSpan) {
                            let value = minSlider.value;
                            if (group.min.includes("income")) {
                                value = parseInt(value).toLocaleString("de-DE");
                            }
                            minValueSpan.textContent = value;
                            this.updateValuePosition(minSlider, minValueSpan);
                        }
                    }
                    this.updateSliderFill(group.max);
                });
            }
        });
    }

    setupSliderUpdates() {
        const sliders = [
            "age-min",
            "age-max",
            "height-min",
            "height-max",
            "weight-min",
            "weight-max",
            "income-min",
            "income-max",
            "attractiveness-min",
            "attractiveness-max",
        ];

        sliders.forEach((sliderId) => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(sliderId + "-value");

            if (slider && valueSpan) {
                const updateSlider = () => {
                    let value = slider.value;
                    // Format income values
                    if (sliderId.includes("income")) {
                        value = parseInt(value).toLocaleString("de-DE");
                    }
                    valueSpan.textContent = value;

                    // Update position of value label above handle
                    this.updateValuePosition(slider, valueSpan);

                    // Update slider fill
                    this.updateSliderFill(sliderId);
                };

                slider.addEventListener("input", updateSlider);

                // Initial update
                updateSlider();
            }
        });
    }

    updateValuePosition(slider, valueSpan) {
        const sliderRect = slider.getBoundingClientRect();
        const sliderWidth = sliderRect.width;
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const value = parseInt(slider.value);

        // Calculate percentage position
        const percentage = ((value - min) / (max - min)) * 100;
        const position = (percentage / 100) * sliderWidth;

        valueSpan.style.left = `${position}px`;
    }

    updateSliderFill(sliderId) {
        const baseId = sliderId.replace("-min", "").replace("-max", "");
        const minSlider = document.getElementById(baseId + "-min");
        const maxSlider = document.getElementById(baseId + "-max");
        const track = minSlider.parentElement;

        if (minSlider && maxSlider && track) {
            const min = parseInt(minSlider.min);
            const max = parseInt(minSlider.max);
            const minVal = parseInt(minSlider.value);
            const maxVal = parseInt(maxSlider.value);

            const leftPercent = ((minVal - min) / (max - min)) * 100;
            const rightPercent = ((maxVal - min) / (max - min)) * 100;

            // Update the ::after pseudo-element through CSS custom properties
            track.style.setProperty("--range-left", `${leftPercent}%`);
            track.style.setProperty(
                "--range-width",
                `${rightPercent - leftPercent}%`,
            );
        }
    }

    updateSliderValues() {
        const sliders = [
            "age-min",
            "age-max",
            "height-min",
            "height-max",
            "weight-min",
            "weight-max",
            "income-min",
            "income-max",
            "attractiveness-min",
            "attractiveness-max",
        ];

        sliders.forEach((sliderId) => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(sliderId + "-value");
            if (slider && valueSpan) {
                let value = slider.value;
                // Format income values
                if (sliderId.includes("income")) {
                    value = parseInt(value).toLocaleString("de-DE");
                }
                valueSpan.textContent = value;

                // Update position and fill
                this.updateValuePosition(slider, valueSpan);
                this.updateSliderFill(sliderId);
            }
        });
    }

    getFormData() {
        // Helper functions
        const getSelectedChoice = (groupSelector) => {
            const activeBtn = document.querySelector(
                `${groupSelector} .choice-btn.active`,
            );
            return activeBtn ? activeBtn.dataset.value : null;
        };

        const isParameterEnabled = (toggleId) => {
            const toggle = document.getElementById(toggleId);
            return toggle ? toggle.checked : true;
        };

        const formData = {
            // Parameter enabled states
            parameterStates: {
                gender: isParameterEnabled("gender-toggle"),
                age: isParameterEnabled("age-toggle"),
                height: isParameterEnabled("height-toggle"),
                weight: isParameterEnabled("weight-toggle"),
                hair: isParameterEnabled("hair-toggle"),
                eye: isParameterEnabled("eye-toggle"),
                attractiveness: isParameterEnabled("attractiveness-toggle"),
                income: isParameterEnabled("income-toggle"),
            },

            age: {
                min: parseInt(document.getElementById("age-min").value),
                max: parseInt(document.getElementById("age-max").value),
            },
            gender: {
                value: getSelectedChoice('[data-parameter="gender"]'),
            },
            height: {
                min: parseInt(document.getElementById("height-min").value),
                max: parseInt(document.getElementById("height-max").value),
            },
            weight: {
                min: parseInt(document.getElementById("weight-min").value),
                max: parseInt(document.getElementById("weight-max").value),
            },
            hairColor: {
                value: getSelectedChoice('[data-parameter="hair-color"]'),
            },
            eyeColor: {
                value: getSelectedChoice('[data-parameter="eye-color"]'),
            },
            income: {
                min: parseInt(document.getElementById("income-min").value),
                max: parseInt(document.getElementById("income-max").value),
            },
            attractiveness: {
                min: parseInt(
                    document.getElementById("attractiveness-min").value,
                ),
                max: parseInt(
                    document.getElementById("attractiveness-max").value,
                ),
            },
        };

        return formData;
    }

    validateFormData(data) {
        const errors = [];

        // Age validation (only if enabled)
        if (data.parameterStates.age && data.age.min > data.age.max) {
            errors.push("Minimum age cannot be greater than maximum age");
        }

        // Height validation (only if enabled)
        if (data.parameterStates.height && data.height.min > data.height.max) {
            errors.push("Minimum height cannot be greater than maximum height");
        }

        // Weight validation (only if enabled)
        if (data.parameterStates.weight && data.weight.min > data.weight.max) {
            errors.push("Minimum weight cannot be greater than maximum weight");
        }

        // Income validation (only if enabled)
        if (data.parameterStates.income && data.income.min > data.income.max) {
            errors.push("Minimum income cannot be greater than maximum income");
        }

        // Attractiveness validation (only if enabled)
        if (
            data.parameterStates.attractiveness &&
            data.attractiveness.min > data.attractiveness.max
        ) {
            errors.push(
                "Minimum attractiveness cannot be greater than maximum attractiveness",
            );
        }

        return errors;
    }

    calculateMatches() {
        const formData = this.getFormData();
        const errors = this.validateFormData(formData);

        if (errors.length > 0) {
            alert("Please fix the following errors:\n" + errors.join("\n"));
            return;
        }

        // Show loading state
        document.getElementById("calculate-btn").textContent = "Calculating...";
        document.getElementById("calculate-btn").disabled = true;

        // Simulate calculation delay for better UX
        setTimeout(() => {
            const result = this.performCalculation(formData);
            this.displayResults(result);

            // Reset button state
            document.getElementById("calculate-btn").textContent =
                "Calculate Matches";
            document.getElementById("calculate-btn").disabled = false;
        }, 1000);
    }

    performCalculation(data) {
        let totalProbability = 1.0;
        const basePopulation = EUROPE_POPULATION * ADULT_POPULATION_RATIO;

        // Calculate base probabilities (skip disabled parameters)
        let genderProb = 1.0;
        let ageProb = 1.0;
        let heightProb = 1.0;
        let weightProb = 1.0;
        let hairProb = 1.0;
        let eyeProb = 1.0;
        let incomeProb = 1.0;
        let attractivenessProb = 1.0;

        // Gender calculation (only if enabled)
        if (data.parameterStates.gender && data.gender.value) {
            genderProb = DEMOGRAPHIC_DATA.gender[data.gender.value] || 0.5;
        }

        // Age calculation (only if enabled)
        if (data.parameterStates.age) {
            ageProb = DEMOGRAPHIC_DATA.age.getDistribution(
                data.age.min,
                data.age.max,
            );
        }

        // Height calculation with gender correlation (only if enabled)
        if (data.parameterStates.height) {
            heightProb = DEMOGRAPHIC_DATA.height.getDistribution(
                data.height.min,
                data.height.max,
                data.gender.value,
            );
        }

        // Weight calculation (only if enabled)
        if (data.parameterStates.weight) {
            weightProb = DEMOGRAPHIC_DATA.weight.getDistribution(
                data.weight.min,
                data.weight.max,
            );
        }

        // Hair color calculation (only if enabled)
        if (data.parameterStates.hair && data.hairColor.value) {
            hairProb = DEMOGRAPHIC_DATA.hairColor[data.hairColor.value] || 0.25;
        }

        // Eye color calculation (only if enabled)
        if (data.parameterStates.eye && data.eyeColor.value) {
            eyeProb = DEMOGRAPHIC_DATA.eyeColor[data.eyeColor.value] || 0.25;
        }

        // Income calculation (only if enabled)
        if (data.parameterStates.income) {
            incomeProb = DEMOGRAPHIC_DATA.income.getDistribution(
                data.income.min,
                data.income.max,
            );
        }

        // Attractiveness calculation (only if enabled)
        if (data.parameterStates.attractiveness) {
            attractivenessProb =
                DEMOGRAPHIC_DATA.attractiveness.getDistribution(
                    data.attractiveness.min,
                    data.attractiveness.max,
                );
        }

        // Apply correlations (only for enabled parameters)
        const correlationFactor = this.calculateCorrelations(data, {
            genderProb,
            ageProb,
            heightProb,
            weightProb,
            hairProb,
            eyeProb,
            incomeProb,
            attractivenessProb,
        });

        // Calculate final probability with correlations
        totalProbability =
            genderProb *
            ageProb *
            heightProb *
            weightProb *
            hairProb *
            eyeProb *
            incomeProb *
            attractivenessProb *
            correlationFactor;

        const estimatedMatches = Math.round(basePopulation * totalProbability);
        const probability = totalProbability;

        return {
            matches: estimatedMatches,
            probability: probability,
            probabilityRatio: probability > 0 ? Math.round(1 / probability) : 0,
        };
    }

    calculateCorrelations(data, probs) {
        let correlationFactor = 1.0;

        // Height-Weight correlation (BMI realistic ranges)
        if (!data.height.any && !data.weight.any) {
            const avgHeight = (data.height.min + data.height.max) / 2;
            const avgWeight = (data.weight.min + data.weight.max) / 2;
            const bmi = avgWeight / Math.pow(avgHeight / 100, 2);

            // Penalize unrealistic BMI combinations
            if (bmi < 16 || bmi > 40) {
                correlationFactor *= 0.1; // Very rare
            } else if (bmi < 18 || bmi > 35) {
                correlationFactor *= 0.3; // Uncommon
            } else if (bmi < 19 || bmi > 30) {
                correlationFactor *= 0.7; // Less common
            }
        }

        // Gender-Height correlation
        if (data.gender.value !== "any" && !data.height.any) {
            const avgHeight = (data.height.min + data.height.max) / 2;

            if (data.gender.value === "male") {
                if (avgHeight < 160) correlationFactor *= 0.2; // Very short men are rare
                if (avgHeight > 200) correlationFactor *= 0.1; // Very tall men are rare
            } else if (data.gender.value === "female") {
                if (avgHeight < 150) correlationFactor *= 0.3; // Very short women are uncommon
                if (avgHeight > 185) correlationFactor *= 0.1; // Very tall women are rare
            }
        }

        // Age-Income correlation
        if (!data.age.any && !data.income.any) {
            const avgAge = (data.age.min + data.age.max) / 2;
            const avgIncome = (data.income.min + data.income.max) / 2;

            // High income at young age is less likely
            if (avgAge < 25 && avgIncome > 5000) {
                correlationFactor *= 0.2;
            } else if (avgAge < 30 && avgIncome > 8000) {
                correlationFactor *= 0.4;
            }

            // Very low income at older age is less common
            if (avgAge > 40 && avgIncome < 1500) {
                correlationFactor *= 0.5;
            }
        }

        // Age-Hair color correlation (gray hair)
        if (!data.age.any && data.hairColor.value === "gray") {
            const avgAge = (data.age.min + data.age.max) / 2;

            if (avgAge < 40) {
                correlationFactor *= 0.1; // Gray hair under 40 is rare
            } else if (avgAge < 50) {
                correlationFactor *= 0.3; // Less common under 50
            } else if (avgAge < 60) {
                correlationFactor *= 0.7; // More common over 50
            }
        }

        // Hair-Eye color correlations
        if (data.hairColor.value !== "any" && data.eyeColor.value !== "any") {
            const hairEyeCorrelations = {
                "blond-blue": 1.5, // More common combination
                "blond-green": 1.2, // Fairly common
                "blond-brown": 0.6, // Less common
                "blond-gray": 0.8, // Uncommon
                "brown-brown": 1.4, // Very common
                "brown-green": 1.0, // Normal
                "brown-blue": 0.8, // Less common
                "brown-gray": 0.9, // Uncommon
                "black-brown": 1.3, // Common
                "black-green": 0.7, // Less common
                "black-blue": 0.4, // Rare
                "black-gray": 0.8, // Uncommon
                "red-green": 1.8, // Strong correlation
                "red-blue": 1.2, // Common
                "red-brown": 0.8, // Less common
                "red-gray": 0.6, // Uncommon
                "gray-blue": 1.1, // Slightly more common
                "gray-brown": 1.0, // Normal
                "gray-green": 0.9, // Slightly less common
                "gray-gray": 1.2, // More common in elderly
            };

            const combination = `${data.hairColor.value}-${data.eyeColor.value}`;
            const correlation = hairEyeCorrelations[combination];
            if (correlation) {
                correlationFactor *= correlation;
            }
        }

        // Gender-Attractiveness slight correlation (societal bias consideration)
        if (data.gender.value !== "any" && !data.attractiveness.any) {
            // Very subtle adjustments to reflect rating tendencies
            const avgAttractiveness =
                (data.attractiveness.min + data.attractiveness.max) / 2;
            if (avgAttractiveness > 8) {
                // High attractiveness ratings might be slightly more common for certain demographics
                correlationFactor *= 0.9; // Slightly reduce as very high ratings are rare
            }
        }

        // Age-Attractiveness correlation
        if (!data.age.any && !data.attractiveness.any) {
            const avgAge = (data.age.min + data.age.max) / 2;
            const avgAttractiveness =
                (data.attractiveness.min + data.attractiveness.max) / 2;

            // Very high attractiveness ratings become less common with age
            if (avgAge > 50 && avgAttractiveness > 8) {
                correlationFactor *= 0.6;
            } else if (avgAge > 60 && avgAttractiveness > 7) {
                correlationFactor *= 0.7;
            }
        }

        // Ensure correlation factor doesn't go below a minimum threshold
        return Math.max(correlationFactor, 0.01);
    }

    displayResults(result) {
        const resultsContainer = document.getElementById("results");
        const totalMatchesElement = document.getElementById("total-matches");
        const probabilityElement = document.getElementById("probability");
        const comparisonElement = document.getElementById("comparison");
        const funMessageElement = document.getElementById("fun-message");

        // Format matches number
        const formattedMatches = result.matches.toLocaleString("de-DE");
        totalMatchesElement.textContent = `About ${formattedMatches} people`;

        // Format probability
        if (result.probabilityRatio > 0) {
            probabilityElement.textContent = `1 in ${result.probabilityRatio.toLocaleString("de-DE")}`;
        } else {
            probabilityElement.textContent = "1 in 100+ million";
        }

        // Find appropriate comparison
        const comparison = this.findComparison(result.probability);
        comparisonElement.textContent = comparison;

        // Generate fun message
        const funMessage = this.generateFunMessage(
            result.matches,
            result.probability,
        );
        funMessageElement.textContent = funMessage;

        // Show results with animation
        resultsContainer.classList.remove("hidden");
        resultsContainer.classList.add("fade-in");

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: "smooth" });
    }

    findComparison(probability) {
        for (let i = 0; i < COMPARISONS.length; i++) {
            if (probability >= COMPARISONS[i].probability) {
                return `That's about as likely as ${COMPARISONS[i].text}`;
            }
        }
        return "That's rarer than finding a unicorn! 🦄";
    }

    generateFunMessage(matches, probability) {
        if (matches === 0) {
            return "🦄 You're looking for a unicorn! Your criteria are so specific that nobody matches.";
        } else if (matches < 10) {
            return "🔍 Extremely rare! You could probably count all matches on your fingers.";
        } else if (matches < 100) {
            return "⭐ Super rare! You're looking for someone quite special.";
        } else if (matches < 1000) {
            return "🎯 Pretty specific! You have high standards.";
        } else if (matches < 10000) {
            return "👥 Selective! Still a small group in all of Europe.";
        } else if (matches < 100000) {
            return "📍 Good specificity! A manageable group to find.";
        } else if (matches < 1000000) {
            return "🎪 Decent-sized group! You should be able to find someone.";
        } else {
            return "🎉 Lots of matches! You're not too picky - that's great!";
        }
    }

    resetForm() {
        // Reset all form fields
        document.getElementById("demographic-form").reset();

        // Reset checkboxes and disable states
        const checkboxes = [
            "age-any",
            "height-any",
            "weight-any",
            "income-any",
            "attractiveness-any",
        ];
        checkboxes.forEach((checkboxId) => {
            const checkbox = document.getElementById(checkboxId);
            const inputsId = checkboxId.replace("-any", "-inputs");
            const inputs = document.getElementById(inputsId);

            if (checkbox && inputs) {
                checkbox.checked = false;
                inputs.classList.remove("disabled");
            }
        });

        // Reset slider values
        this.updateSliderValues();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Hide results
        document.getElementById("results").classList.add("hidden");
        document.getElementById("results").classList.remove("fade-in");
    }
}

// Initialize the calculator when the page loads
document.addEventListener("DOMContentLoaded", () => {
    new DemographicCalculator();
});
