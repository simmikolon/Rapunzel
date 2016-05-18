//
//  SKView.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

class RPSKView: SKView {
    
    #if os(iOS)
    @IBOutlet weak var panGestureRecognizer: UIPanGestureRecognizer?
    @IBOutlet weak var tapGestureRecognizer: UITapGestureRecognizer?
    #endif
}
