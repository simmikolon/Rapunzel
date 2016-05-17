//
//  RPInputSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

protocol RPInputSourceDelegate: class {
    
    func inputSourceDidBeginUsingSpecialPower(inputSource: RPInputSource)
    func inputSourceDidEndUsingSpecialPower(inputSource: RPInputSource)
    
    func inputSourceDidBeginAttack(inputSource: RPInputSource)
    func inputSourceDidEndAttack(inputSource: RPInputSource)
    
    func inputSource(inputSource: RPInputSource, didUpdateDisplacement: float2)
}

class RPInputSource {
    
    weak var delegate: RPInputSourceDelegate?
}
