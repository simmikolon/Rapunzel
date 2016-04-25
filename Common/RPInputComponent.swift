//
//  RPInputComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//


#if os(iOS)
    import UIKit
#else
    import Foundation
#endif

import GameplayKit

protocol RPInputComponentDelegate: class {
    
    func didTap()
    func didChangeMotion(xAcceleration: CGFloat)
    func keyLeftDown()
    func keyLeftUp()
    func keyRightDown()
    func keyRightUp()
}

protocol ControllableEntity {
    
}

class RPInputComponent: GKComponent {
    
    weak var delegate: RPInputComponentDelegate?
    
    override init() {
        super.init()
    }
    
    init(delegate: RPInputComponentDelegate) {
        
        super.init()
        self.delegate = delegate
    }
    
    func didChangeMotion(xAcceleration: CGFloat) {
        
        self.delegate?.didChangeMotion(xAcceleration)
    }

    func touchesBegan() {

        delegate?.didTap()
    }
    
    func keyLeftDown() {
        
        delegate?.keyLeftDown()
    }
    
    func keyRightDown() {
        
        delegate?.keyRightDown()
    }
    
    func keyLeftUp() {
        
        delegate?.keyLeftUp()
    }
    
    func keyRightUp() {
        
        delegate?.keyRightUp()
    }
}
