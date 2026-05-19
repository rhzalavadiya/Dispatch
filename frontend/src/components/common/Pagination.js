import React, { useState, useEffect } from "react";
import {
    FaAngleDoubleLeft,
    FaAngleLeft,
    FaAngleRight,
    FaAngleDoubleRight,
} from "react-icons/fa";

const Pagination = ({ totalRows, rowsPerPage, currentPage, paginate }) => {
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const [inputPage, setInputPage] = useState(currentPage);

    useEffect(() => {
        setInputPage(currentPage);
    }, [currentPage]);

const handleInputChange = (e) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) return;

    if (value === "") {
        setInputPage("");
        return;
    }

    let num = Number(value);

    if (num > totalPages) num = totalPages;

    setInputPage(num);
};
    const handleInputSubmit = () => {
        let page = Number(inputPage);
        if (!page || page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        paginate(page);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleInputSubmit();
        }
    };

    const isFirstDisabled = currentPage === 1 || totalPages === 0;
    const isLastDisabled = currentPage === totalPages || totalPages === 0;

    return (
        <div className="custom-pagination-container">
                    { totalPages > 0 && (
            <div className="custom-pagination">
                <button
                    className="pagination-btn"
                    onClick={() => paginate(1)}
                    disabled={isFirstDisabled}
                    title="First Page"
                >
                    <FaAngleDoubleLeft />
                </button>

                <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={isFirstDisabled}
                    title="Previous Page"
                >
                    <FaAngleLeft />
                </button>

                <div className="page-input-box">
                    <input
                        type="text"
                        value={inputPage}
                        onChange={handleInputChange}
                        onBlur={handleInputSubmit}
                        onKeyDown={handleKeyDown}
                    />
                    <span className="page-info">
                        of <strong>{totalPages}</strong>
                    </span>
                </div>

                <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={isLastDisabled}
                    title="Next Page"
                >
                    <FaAngleRight />
                </button>

                <button
                    className="pagination-btn"
                    onClick={() => paginate(totalPages)}
                    disabled={isLastDisabled}
                    title="Last Page"
                >
                    <FaAngleDoubleRight />
                </button>
            </div>
             )}
        </div>
    );
};

export default Pagination;
