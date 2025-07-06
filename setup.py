from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as f:
    requirements = f.read().splitlines()

setup(
    name="efiagent",
    version="0.1.0",
    author="WuMai Tech",
    author_email="info@wumaitech.com",
    description="企业级多智能体协作系统",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/wumaitech/EFIAgent",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "efiagent=efiagent.cli:main",
        ],
    },
)