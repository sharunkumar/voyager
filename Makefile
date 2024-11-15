
sync-upstream:
	git switch main
	git pull --all --prune
	git merge upstream/main