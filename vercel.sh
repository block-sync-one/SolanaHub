#!/bin/bash
 
if [[ $VERCEL_GIT_COMMIT_REF == "main" ]] ; then 
  echo "This is our main branch"
  npm run build:main
elif [[ $VERCEL_GIT_COMMIT_REF == "ssr" ]] ; then
  echo "This is our ssr branch"
  npm run build:ssr
else 
  echo "This is dev branch"
  npm run build:dev
fi


# sh vercel.sh