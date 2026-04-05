#include <iostream>
#include <cmath>
#include <string>
#include <iomanip>

// ─── Paste your weights here after training ───────────────
// These values come from the output of placement_model.cpp
const double W_DSA        = 6.6007;
const double W_PROJECTS   = 4.9706;
const double W_IQ         = 3.7706;
const double W_ATTENDANCE = 2.6825;
const double BIAS         = -8.8813;

// ─── Paste your normalization stats here too ─────────────
// These also come from the output of placement_model.cpp
const double DSA_MIN        = 0;
const double DSA_MAX        = 500;
const double PROJECTS_MIN   = 0;
const double PROJECTS_MAX   = 10;
const double IQ_MIN         = 60;
const double IQ_MAX         = 140;
const double ATTENDANCE_MIN = 30;
const double ATTENDANCE_MAX = 100;

// ─── Normalize ────────────────────────────────────────────
double normalize(double value, double min, double max) {
    if (max == min) return 0.0;
    return (value - min) / (max - min);
}

// ─── Sigmoid ──────────────────────────────────────────────
double sigmoid(double z) {
    return 1.0 / (1.0 + exp(-z));
}

// ─── Predict ──────────────────────────────────────────────
void predict(std::string name, double dsa, double projects,
             double iq, double attendance) {

    // normalize each feature
    double n_dsa        = normalize(dsa,        DSA_MIN,        DSA_MAX);
    double n_projects   = normalize(projects,   PROJECTS_MIN,   PROJECTS_MAX);
    double n_iq         = normalize(iq,         IQ_MIN,         IQ_MAX);
    double n_attendance = normalize(attendance, ATTENDANCE_MIN, ATTENDANCE_MAX);

    // forward pass
    double z = W_DSA        * n_dsa
             + W_PROJECTS   * n_projects
             + W_IQ         * n_iq
             + W_ATTENDANCE * n_attendance
             + BIAS;

    double P = sigmoid(z);

    // print everything
    std::cout << "─────────────────────────────────────\n";
    std::cout << "Student        : " << name << "\n";
    std::cout << "\n";
    std::cout << "Raw inputs:\n";
    std::cout << "  DSA          : " << dsa        << "\n";
    std::cout << "  Projects     : " << projects   << "\n";
    std::cout << "  IQ           : " << iq         << "\n";
    std::cout << "  Attendance   : " << attendance << "%\n";
    std::cout << "\n";
    std::cout << "Normalized inputs:\n";
    std::cout << "  DSA          : " << std::fixed << std::setprecision(4) << n_dsa        << "\n";
    std::cout << "  Projects     : " << std::fixed << std::setprecision(4) << n_projects   << "\n";
    std::cout << "  IQ           : " << std::fixed << std::setprecision(4) << n_iq         << "\n";
    std::cout << "  Attendance   : " << std::fixed << std::setprecision(4) << n_attendance << "\n";
    std::cout << "\n";
    std::cout << "z (weighted sum) : " << std::fixed << std::setprecision(4) << z << "\n";
    std::cout << "Probability      : " << std::fixed << std::setprecision(4) << P << "\n";
    std::cout << "Result           : " << (P >= 0.5 ? "PLACED ✓" : "NOT PLACED ✗") << "\n";
    std::cout << "─────────────────────────────────────\n\n";
}

// ─── Main ─────────────────────────────────────────────────
int main() {

    // add as many students as you want here
    predict("Arjun",   380, 6, 105, 88);
    predict("Rohit",   50,  1, 65,  40);
    predict("Priya",   450, 9, 135, 97);
    predict("Amit",    120, 2, 72,  55);

    return 0;
}