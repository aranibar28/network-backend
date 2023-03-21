const titleCase = (str1, str2) => {
   const name1 = str1.split(' ')[0];
   const name2 = str2.split(' ')[0];

   const full_name = `${name1} ${name2}`
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase())
      .trim();

   return full_name;
}

module.exports = {
   titleCase,
};
