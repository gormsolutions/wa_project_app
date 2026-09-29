from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in wa_project/__init__.py
from wa_project import __version__ as version

setup(
	name="wa_project",
	version=version,
	description="Wa Solutions POW and BOQ",
	author="Stephen Mutua",
	author_email="ssmutua@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
