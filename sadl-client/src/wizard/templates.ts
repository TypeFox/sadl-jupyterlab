
export
    function sadl_proj_descr(name: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
	<name>${name}</name>
</projectDescription>`}

export
    function sadl_proj_Shape_sadle(): string {
    return `uri "http://sadl.org/Shapes.sadl" alias Shapes.

Shape is a class described by area with values of type float.`}