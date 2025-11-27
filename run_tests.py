"""
Test runner script for Equipment Reservation System
"""
import subprocess
import sys


def run_all_tests():
    """Run all tests"""
    print("Running all unit tests...")
    result = subprocess.run([sys.executable, '-m', 'pytest', 'tests/', '-v'])
    return result.returncode


def run_tests_with_coverage():
    """Run tests with coverage report"""
    print("Running tests with coverage...")
    result = subprocess.run([
        sys.executable, '-m', 'pytest', 'tests/',
        '--cov=.',
        '--cov-report=html',
        '--cov-report=term-missing',
        '-v'
    ])
    return result.returncode


def run_specific_test_file(test_file):
    """Run specific test file"""
    print(f"Running tests in {test_file}...")
    result = subprocess.run(
        [sys.executable, '-m', 'pytest', f'tests/{test_file}', '-v'])
    return result.returncode


def run_specific_test(test_path):
    """Run specific test"""
    print(f"Running test {test_path}...")
    result = subprocess.run(
        [sys.executable, '-m', 'pytest', f'tests/{test_path}', '-v'])
    return result.returncode


if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'coverage':
            exit_code = run_tests_with_coverage()
        elif command.startswith('test_'):
            # Specific test file
            exit_code = run_specific_test_file(command)
        else:
            # Specific test path
            exit_code = run_specific_test(command)
    else:
        # Run all tests
        exit_code = run_all_tests()

    sys.exit(exit_code)
