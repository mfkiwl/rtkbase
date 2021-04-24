#!/bin/bash
#This script should be run from a crontab
#You can customize archive_name and archive_rotate in settings.conf

BASEDIR=$(dirname "$0")
source <( grep = ${BASEDIR}/settings.conf )
cd ${datadir}

check_space(){
  df -kP ${datadir} | grep -v '^Filesystem' | awk '{ print $4 }'
}

#Check if there is enough available space (more than 500MB), and delete oldest archive if needed.
while [[ $(check_space) -lt 5000000 ]]
do
  file_to_delete=$(find . -maxdepth 1 -type f | sort -r | tail -1)
  #Test if there is a file to delete
  if [[ -z ${file_to_delete} ]]
  then
    break
  fi
  echo 'Not enough remaining space. Deleting' ${file_to_delete}
  #Exit if can't delete
  if ! $(rm -f ${file_to_delete})
  then
    break
  fi
done


#archive and compress previous day's gnss data.
#find . -maxdepth 1 -type f -mtime -1 -mmin +60 -name "*.ubx*" -exec tar -jcvf ${archive_name} --remove-files {} +;
find . -maxdepth 1 -type f -mtime -1 -mmin +60 -name "*.ubx*" -exec zip -m9 ${archive_name} {} +;

#delete gnss data older than x days.
#find . -maxdepth 1 -type f -name "*.tar.bz2" -mtime +${archive_rotate} -delete
find . -maxdepth 1 -type f -name "*.zip" -mtime +${archive_rotate} -delete

