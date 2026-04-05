#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <cmath>
#include <string>
#include <algorithm>
#include <iomanip>

// ─── Student struct ───────────────────────────────────────
struct Student {
    std::string name;
    double dsa;
    double projects;
    double iq;
    double attendance;
    int label;  // 1 = placed, 0 = not placed
};

// ─── Normalization stats (computed from training data) ────
struct NormStats {
    double dsa_min,        dsa_max;
    double projects_min,   projects_max;
    double iq_min,         iq_max;
    double attendance_min, attendance_max;
};

// ─── Model weights ────────────────────────────────────────
struct Model {
    double w_dsa        = 0.0;
    double w_projects   = 0.0;
    double w_iq         = 0.0;
    double w_attendance = 0.0;
    double bias         = 0.0;
};

// ─── Read CSV file ────────────────────────────────────────
std::vector<Student> loadCSV(const std::string& filename) {
    std::vector<Student> data;
    std::ifstream file(filename);

    if (!file.is_open()) {
        std::cerr << "Error: could not open " << filename << "\n";
        return data;
    }

    std::string line;
    std::getline(file, line); // skip header row

    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string token;
        Student s;

        std::getline(ss, s.name,      ',');
        std::getline(ss, token, ','); s.dsa        = std::stod(token);
        std::getline(ss, token, ','); s.projects   = std::stod(token);
        std::getline(ss, token, ','); s.iq         = std::stod(token);
        std::getline(ss, token, ','); s.attendance = std::stod(token);
        std::getline(ss, token, ','); s.label      = std::stoi(token);

        data.push_back(s);
    }

    std::cout << "Loaded " << data.size() << " students from " << filename << "\n";
    return data;
}

// ─── Compute min and max from training data ───────────────
// We do NOT hardcode these values
// We calculate from actual data so normalization is fair
NormStats computeNormStats(const std::vector<Student>& data) {
    NormStats stats;

    // initialize with first student's values
    stats.dsa_min        = stats.dsa_max        = data[0].dsa;
    stats.projects_min   = stats.projects_max   = data[0].projects;
    stats.iq_min         = stats.iq_max         = data[0].iq;
    stats.attendance_min = stats.attendance_max = data[0].attendance;

    for (const Student& s : data) {
        stats.dsa_min        = std::min(stats.dsa_min,        s.dsa);
        stats.dsa_max        = std::max(stats.dsa_max,        s.dsa);
        stats.projects_min   = std::min(stats.projects_min,   s.projects);
        stats.projects_max   = std::max(stats.projects_max,   s.projects);
        stats.iq_min         = std::min(stats.iq_min,         s.iq);
        stats.iq_max         = std::max(stats.iq_max,         s.iq);
        stats.attendance_min = std::min(stats.attendance_min, s.attendance);
        stats.attendance_max = std::max(stats.attendance_max, s.attendance);
    }

    std::cout << "\n─── Normalization Stats (from training data) ───\n";
    std::cout << "DSA:        [" << stats.dsa_min        << ", " << stats.dsa_max        << "]\n";
    std::cout << "Projects:   [" << stats.projects_min   << ", " << stats.projects_max   << "]\n";
    std::cout << "IQ:         [" << stats.iq_min         << ", " << stats.iq_max         << "]\n";
    std::cout << "Attendance: [" << stats.attendance_min << ", " << stats.attendance_max << "]\n";

    return stats;
}

// ─── Normalize a single value ─────────────────────────────
// formula: (value - min) / (max - min)
// result is always between 0 and 1
double normalize(double value, double min, double max) {
    if (max == min) return 0.0; // avoid divide by zero
    return (value - min) / (max - min);
}

// ─── Sigmoid ──────────────────────────────────────────────
double sigmoid(double z) {
    return 1.0 / (1.0 + exp(-z));
}

// ─── Forward pass ─────────────────────────────────────────
double predict(const Model& m, const Student& s, const NormStats& stats) {
    // normalize each feature using stats from training data
    double n_dsa        = normalize(s.dsa,        stats.dsa_min,        stats.dsa_max);
    double n_projects   = normalize(s.projects,   stats.projects_min,   stats.projects_max);
    double n_iq         = normalize(s.iq,         stats.iq_min,         stats.iq_max);
    double n_attendance = normalize(s.attendance, stats.attendance_min, stats.attendance_max);

    double z = m.w_dsa        * n_dsa
             + m.w_projects   * n_projects
             + m.w_iq         * n_iq
             + m.w_attendance * n_attendance
             + m.bias;

    return sigmoid(z);
}

// ─── Binary cross entropy loss ────────────────────────────
double computeLoss(double P, int y) {
    double eps = 1e-9;
    return -(y * log(P + eps) + (1 - y) * log(1 - P + eps));
}

// ─── Train ────────────────────────────────────────────────
void train(Model& m, const std::vector<Student>& data,
           const NormStats& stats, double lr, int epochs) {

    std::cout << "\n─── Training ───\n";

    for (int epoch = 0; epoch < epochs; epoch++) {

        double totalLoss = 0.0;

        for (const Student& s : data) {

            // forward pass
            double P   = predict(m, s, stats);
            totalLoss += computeLoss(P, s.label);

            // error
            double error = P - s.label;

            // update weights immediately after each student
            m.w_dsa        -= lr * error * normalize(s.dsa,        stats.dsa_min,        stats.dsa_max);
            m.w_projects   -= lr * error * normalize(s.projects,   stats.projects_min,   stats.projects_max);
            m.w_iq         -= lr * error * normalize(s.iq,         stats.iq_min,         stats.iq_max);
            m.w_attendance -= lr * error * normalize(s.attendance, stats.attendance_min, stats.attendance_max);
            m.bias         -= lr * error;
        }

        if (epoch % 100 == 0) {
            std::cout << "Epoch " << std::setw(4) << epoch
                      << "  |  Loss: " << std::fixed << std::setprecision(4)
                      << totalLoss / data.size() << "\n";
        }
    }
}
// ─── Accuracy on training data ────────────────────────────
void evaluate(const Model& m, const std::vector<Student>& data,
              const NormStats& stats) {
    int correct = 0;
    for (const Student& s : data) {
        double P      = predict(m, s, stats);
        int predicted = (P >= 0.5) ? 1 : 0;
        if (predicted == s.label) correct++;
    }
    double accuracy = (double)correct / data.size() * 100.0;
    std::cout << "\n─── Accuracy on training data ───\n";
    std::cout << "Correct: " << correct << " / " << data.size()
              << "  (" << std::fixed << std::setprecision(2) << accuracy << "%)\n";
}

// ─── Main ─────────────────────────────────────────────────
int main() {

    // load data from CSV
    std::vector<Student> data = loadCSV("students.csv");
    if (data.empty()) return 1;

    // compute normalization stats FROM training data
    // no hardcoding — model figures out min/max itself
    NormStats stats = computeNormStats(data);

    // initialize model
    Model model;

    // train
    train(model, data, stats, 0.1, 1000);

    // print final weights
    std::cout << "\n─── Final Weights ───\n";
    std::cout << "w_dsa:        " << model.w_dsa        << "\n";
    std::cout << "w_projects:   " << model.w_projects   << "\n";
    std::cout << "w_iq:         " << model.w_iq         << "\n";
    std::cout << "w_attendance: " << model.w_attendance << "\n";
    std::cout << "bias:         " << model.bias         << "\n";

    // evaluate accuracy
    evaluate(model, data, stats);
    return 0;
}