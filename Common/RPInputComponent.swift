//
//  RPInputComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import GameplayKit

protocol RPInputComponentDelegate: class {
    
    func didTap()
    func didChangeMotion(xAcceleration: CGFloat)
}

class RPInputComponent: GKComponent {
    
    weak var delegate: RPInputComponentDelegate?
    
    override init() {
        super.init()
    }
    
    init(withDelegate delegate: RPInputComponentDelegate) {
        super.init()
        self.delegate = delegate
    }
    
    func didChangeMotion(xAcceleration: CGFloat) {
        
        self.delegate?.didChangeMotion(xAcceleration)
    }

    func touchesBegan() {

        delegate?.didTap()
    }
}
